// Tests d'intégration : nécessitent un MongoDB local. Base de test isolée, jamais la base de développement.
// Variable optionnelle : MONGODB_URI_TEST (le nom de la base doit se terminer par "_test").
// Sans MongoDB joignable, ces tests sont ignorés (skip) au lieu d'échouer.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/livre_compagnon_test';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = uri;
process.env.JWT_SECRET = 'x'.repeat(48);
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.APP_TIMEZONE = 'Africa/Dakar';
process.env.AUTH_RATE_LIMIT = '1000'; // pas de limitation pendant les tests

let dbUp = false;
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
  dbUp = true;
} catch {
  /* MongoDB indisponible */
}
const skip = dbUp ? false : 'MongoDB de test indisponible';
if (dbUp && !mongoose.connection.name.endsWith('_test')) {
  await mongoose.disconnect();
  throw new Error('Refus de lancer les tests : le nom de la base doit se terminer par "_test".');
}

let server, base, ctx = {};

function client() {
  let cookie = '';
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const token = res.headers.getSetCookie().find((c) => c.startsWith('token='));
    if (token) cookie = token.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  return {
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b),
    put: (p, b) => call('PUT', p, b),
    patch: (p, b) => call('PATCH', p, b),
    cookie: () => cookie,
    call,
    del: (p) => call('DELETE', p),
  };
}

before(async () => {
  if (!dbUp) return;
  await mongoose.connection.dropDatabase();
  const { default: app } = await import('../src/app.js');
  const { default: bcrypt } = await import('bcryptjs');
  const { User } = await import('../src/models/User.js');
  const { Book } = await import('../src/models/Book.js');
  const { Question } = await import('../src/models/Question.js');
  const { todayUTCDate } = await import('../src/utils/dates.js');
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));

  await User.create({
    firstName: 'Admin', email: 'admin@test.local', role: 'admin',
    passwordHash: await bcrypt.hash('AdminPass1', 4),
  });
  const book = await Book.create({ title: 'Livre test', slug: 'livre-test', isPublished: true });
  const today = todayUTCDate();
  const day = (n) => new Date(today.getTime() + n * 86400000);
  const mk = (question, status, publicationDate, correctAnswer = 1) =>
    Question.create({
      book: book._id, question, answers: ['A', 'B', 'C', 'D'], correctAnswer,
      explanation: `Explication : ${question}`, status, publicationDate,
    });
  ctx = {
    book,
    qToday: await mk('Question du jour ?', 'published', today),
    qYesterday: await mk('Question d\'hier ?', 'published', day(-1), 2),
    qDraft: await mk('Question brouillon ?', 'draft', today),
    qFuture: await mk('Question future ?', 'published', day(1)),
  };

  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) server.close();
  if (dbUp) await mongoose.disconnect();
});

const reader = client();
const reader2 = client();
const admin = client();
let firstAnswerId;

test('inscription valide : 201, rôle user, pas de hash dans la réponse', { skip }, async () => {
  const r = await reader.post('/auth/register', {
    firstName: 'Awa', email: 'Awa@Test.local', password: 'motdepasse1', confirmPassword: 'motdepasse1',
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.user.role, 'user');
  assert.equal(r.body.data.user.email, 'awa@test.local');
  assert.equal('passwordHash' in r.body.data.user, false);
});

test('email déjà utilisé → 409', { skip }, async () => {
  const r = await client().post('/auth/register', {
    firstName: 'Bis', email: 'awa@test.local', password: 'motdepasse1', confirmPassword: 'motdepasse1',
  });
  assert.equal(r.status, 409);
});

test('connexion : mauvais mot de passe → 401, bon mot de passe → 200', { skip }, async () => {
  const c = client();
  assert.equal((await c.post('/auth/login', { email: 'awa@test.local', password: 'faux-mdp-1' })).status, 401);
  assert.equal((await c.post('/auth/login', { email: 'awa@test.local', password: 'motdepasse1' })).status, 200);
  assert.equal((await c.get('/auth/me')).status, 200);
});

test('un lecteur n\'a pas accès aux routes d\'administration → 403', { skip }, async () => {
  const r = await reader.post('/questions', {});
  assert.equal(r.status, 403);
});

test('visiteur : seules les questions disponibles sont listées, sans bonne réponse', { skip }, async () => {
  const r = await client().get('/questions');
  assert.equal(r.status, 200);
  const texts = r.body.data.questions.map((q) => q.question).sort();
  assert.deepEqual(texts, ['Question d\'hier ?', 'Question du jour ?']);
  for (const q of r.body.data.questions) {
    assert.equal('correctAnswer' in q, false);
    assert.equal('explanation' in q, false);
  }
});

test('brouillon et question future introuvables pour un lecteur', { skip }, async () => {
  assert.equal((await client().get(`/questions/${ctx.qDraft._id}`)).status, 404);
  assert.equal((await client().get(`/questions/${ctx.qFuture._id}`)).status, 404);
});

test('question du jour : la question datée d\'aujourd\'hui, sans bonne réponse', { skip }, async () => {
  const r = await client().get('/questions/today');
  assert.equal(r.status, 200);
  assert.equal(r.body.data.question.id, ctx.qToday._id.toString());
  assert.equal(r.body.data.isFallback, false);
  assert.equal('correctAnswer' in r.body.data.question, false);
});

test('question du jour : repli sur la dernière question passée si aucune pour aujourd\'hui', { skip }, async () => {
  const { Question } = await import('../src/models/Question.js');
  await Question.updateOne({ _id: ctx.qToday._id }, { status: 'archived' });
  const r = await client().get('/questions/today');
  await Question.updateOne({ _id: ctx.qToday._id }, { status: 'published' });
  assert.equal(r.body.data.question.id, ctx.qYesterday._id.toString());
  assert.equal(r.body.data.isFallback, true);
});

test('réponse : index invalide, champ isCorrect imposé, brouillon, question future', { skip }, async () => {
  const q = ctx.qToday._id.toString();
  assert.equal((await reader.post('/answers', { questionId: q, selectedAnswer: 4 })).status, 400);
  assert.equal((await reader.post('/answers', { questionId: q, selectedAnswer: 0, isCorrect: true })).status, 400);
  assert.equal((await reader.post('/answers', { questionId: ctx.qDraft._id.toString(), selectedAnswer: 1 })).status, 404);
  assert.equal((await reader.post('/answers', { questionId: ctx.qFuture._id.toString(), selectedAnswer: 1 })).status, 404);
});

test('bonne réponse : enregistrée, corrigée par le serveur, explication renvoyée', { skip }, async () => {
  const r = await reader.post('/answers', { questionId: ctx.qToday._id.toString(), selectedAnswer: 1 });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.result.isCorrect, true);
  assert.equal(r.body.data.result.correctAnswer, 1);
  assert.match(r.body.data.result.explanation, /Explication/);
  firstAnswerId = r.body.data.result.id;
});

test('seconde tentative sur la même question → 409', { skip }, async () => {
  const r = await reader.post('/answers', { questionId: ctx.qToday._id.toString(), selectedAnswer: 2 });
  assert.equal(r.status, 409);
});

test('mauvaise réponse : isCorrect false', { skip }, async () => {
  const r = await reader.post('/answers', { questionId: ctx.qYesterday._id.toString(), selectedAnswer: 0 });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.result.isCorrect, false);
});

test('progression : 2 réponses, 1 correcte, 50 %, 1 jour actif', { skip }, async () => {
  const r = await reader.get('/answers/progress');
  assert.equal(r.status, 200);
  assert.deepEqual(
    { a: r.body.data.answered, c: r.body.data.correct, i: r.body.data.incorrect, s: r.body.data.successRate, d: r.body.data.activeDays, p: r.body.data.progressPercent },
    { a: 2, c: 1, i: 1, s: 50, d: 1, p: 100 }
  );
});

test('progression d\'un nouvel utilisateur : 0 %', { skip }, async () => {
  await reader2.post('/auth/register', {
    firstName: 'Moussa', email: 'moussa@test.local', password: 'motdepasse2', confirmPassword: 'motdepasse2',
  });
  const r = await reader2.get('/answers/progress');
  assert.equal(r.body.data.successRate, 0);
  assert.equal(r.body.data.answered, 0);
});

test('historique : trié du plus récent, et isolé entre utilisateurs', { skip }, async () => {
  const mine = await reader.get('/answers/history');
  assert.equal(mine.body.data.history.length, 2);
  // La réponse enregistrée en dernier (question d'hier) arrive en premier
  assert.equal(mine.body.data.history[0].question.id, ctx.qYesterday._id.toString());
  const dates = mine.body.data.history.map((h) => new Date(h.answeredAt).getTime());
  assert.ok(dates[0] >= dates[1]);

  const theirs = await reader2.get('/answers/history');
  assert.equal(theirs.body.data.history.length, 0);
  assert.equal((await reader2.get(`/answers/${firstAnswerId}`)).status, 404);
  assert.equal((await reader.get(`/answers/${firstAnswerId}`)).status, 200);
});

test('question du jour après réponse : alreadyAnswered et answerId', { skip }, async () => {
  const r = await reader.get('/questions/today');
  assert.equal(r.body.data.alreadyAnswered, true);
  assert.equal(r.body.data.answerId, firstAnswerId);
});

test('liste des questions : alreadyAnswered et answerId pour un lecteur connecté', { skip }, async () => {
  const r = await reader.get('/questions?scope=public');
  assert.equal(r.status, 200);
  const byText = Object.fromEntries(r.body.data.questions.map((q) => [q.question, q]));
  assert.equal(byText['Question du jour ?'].alreadyAnswered, true);
  assert.equal(byText['Question du jour ?'].answerId, firstAnswerId);
  assert.equal(byText["Question d'hier ?"].alreadyAnswered, true);
  assert.equal('correctAnswer' in byText['Question du jour ?'], false);
});

test('administration : CRUD des questions et verrouillage après réponses', { skip }, async () => {
  assert.equal((await admin.post('/auth/login', { email: 'admin@test.local', password: 'AdminPass1' })).status, 200);

  const create = await admin.post('/questions', {
    book: ctx.book._id.toString(), question: 'Nouvelle question admin ?',
    answers: ['un', 'deux', 'trois', 'quatre'], correctAnswer: 2, explanation: 'Parce que.',
  });
  assert.equal(create.status, 201);
  assert.equal(create.body.data.question.status, 'draft');
  const newId = create.body.data.question._id;

  assert.equal((await admin.put(`/questions/${newId}`, { explanation: 'Mise à jour' })).status, 200);
  const drafts = await admin.get('/questions?status=draft');
  assert.ok(drafts.body.data.questions.every((q) => q.status === 'draft' && 'correctAnswer' in q));

  // Question déjà répondue : propositions et bonne réponse verrouillées, suppression refusée
  const locked = ctx.qToday._id.toString();
  assert.equal((await admin.put(`/questions/${locked}`, { correctAnswer: 3 })).status, 409);
  assert.equal((await admin.put(`/questions/${locked}`, { explanation: 'Texte corrigé' })).status, 200);
  assert.equal((await admin.del(`/questions/${locked}`)).status, 409);

  assert.equal((await admin.del(`/questions/${newId}`)).status, 200);
});

test('publication sans date : la date du jour est attribuée', { skip }, async () => {
  const r = await admin.post('/questions', {
    book: ctx.book._id.toString(), question: 'Publiée directement ?',
    answers: ['a', 'b', 'c', 'd'], correctAnswer: 0, status: 'published',
  });
  assert.equal(r.status, 201);
  assert.ok(r.body.data.question.publicationDate);
});

test('profil : le prénom est modifiable, le rôle ne l\'est pas', { skip }, async () => {
  assert.equal((await reader2.patch('/auth/profile', { role: 'admin', firstName: 'Moussa' })).status, 400);
  const r = await reader2.patch('/auth/profile', { firstName: 'Moussa D' });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.user.firstName, 'Moussa D');
  assert.equal(r.body.data.user.role, 'user');
});

test('mot de passe : mauvais mot de passe actuel → 401, puis changement valide', { skip }, async () => {
  const bad = await reader2.put('/auth/password', { currentPassword: 'faux-mdp-9', newPassword: 'nouveaumdp3', confirmPassword: 'nouveaumdp3' });
  assert.equal(bad.status, 401);
  const good = await reader2.put('/auth/password', { currentPassword: 'motdepasse2', newPassword: 'nouveaumdp3', confirmPassword: 'nouveaumdp3' });
  assert.equal(good.status, 200);
  assert.equal((await client().post('/auth/login', { email: 'moussa@test.local', password: 'nouveaumdp3' })).status, 200);
});

test('administration : dashboard, utilisateurs et réponses calculés depuis la base', { skip }, async () => {
  const d = await admin.get('/admin/dashboard');
  assert.equal(d.status, 200);
  assert.equal(d.body.data.totalUsers, 2); // Awa et Moussa (l\'admin n\'est pas compté)
  assert.equal(d.body.data.totalAnswers, 2);
  assert.equal(d.body.data.successRate, 50);
  assert.equal(d.body.data.activeUsersLast7Days, 1);

  const users = await admin.get('/admin/users?search=awa');
  assert.equal(users.body.data.users.length, 1);
  assert.equal('passwordHash' in users.body.data.users[0], false);
  assert.equal(users.body.data.users[0].answered, 2);

  const wrong = await admin.get('/admin/answers?result=incorrect');
  assert.equal(wrong.body.data.answers.length, 1);
  assert.equal('email' in wrong.body.data.answers[0].user, false);
  const future = await admin.get('/admin/answers?from=2999-01-01');
  assert.equal(future.body.data.answers.length, 0);
});

test('un lecteur ne peut pas lire les routes /admin → 403', { skip }, async () => {
  assert.equal((await reader.get('/admin/dashboard')).status, 403);
});

test('suppression de compte : mot de passe requis, données supprimées', { skip }, async () => {
  assert.equal((await reader.del('/auth/account')).status, 400); // corps sans mot de passe
  const r = await reader.call('DELETE', '/auth/account', { password: 'faux-mdp-9' });
  assert.equal(r.status, 401);
  const ok = await reader.call('DELETE', '/auth/account', { password: 'motdepasse1' });
  assert.equal(ok.status, 200);
  const { Answer } = await import('../src/models/Answer.js');
  assert.equal(await Answer.countDocuments(), 0);
});

test('administration : QR code d\'un livre (JSON, PNG, SVG) et accès réservé', { skip }, async () => {
  const id = ctx.book._id.toString();
  const json = await admin.get(`/books/${id}/qr`);
  assert.equal(json.status, 200);
  assert.equal(json.body.data.url, 'http://localhost:5173/livre/livre-test');
  assert.equal(json.body.data.https, false); // CLIENT_URL de test en http
  assert.match(json.body.data.svg, /<svg/);

  const png = await fetch(`${base}/books/${id}/qr?format=png`, { headers: { Cookie: admin.cookie() } });
  assert.equal(png.status, 200);
  assert.equal(png.headers.get('content-type'), 'image/png');
  assert.match(png.headers.get('content-disposition'), /qr-livre-test\.png/);
  const bytes = new Uint8Array(await png.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47]);

  assert.equal((await admin.get(`/books/${id}/qr?format=gif`)).status, 400);
  assert.equal((await client().get(`/books/${id}/qr`)).status, 401);
});

test('administration : création d\'un livre, slug en double refusé (409)', { skip }, async () => {
  const body = { title: 'Second livre', slug: 'second-livre', isPublished: true };
  assert.equal((await admin.post('/books', body)).status, 201);
  const dup = await admin.post('/books', body);
  assert.equal(dup.status, 409);
  assert.match(dup.body.message, /slug/);
});

test('image de couverture : import, lecture publique, refus des faux fichiers, suppression', { skip }, async () => {
  const { qrPng } = await import('../src/services/qr.service.js');
  const png = await qrPng('https://exemple.com/livre/x'); // un vrai PNG pour le test
  const id = ctx.book._id.toString();
  const send = (body, type = 'image/png', cookie = admin.cookie()) =>
    fetch(`${base}/books/${id}/cover`, { method: 'PUT', headers: { 'Content-Type': type, Cookie: cookie }, body });

  assert.equal((await send(png, 'image/png', reader2.cookie())).status, 403); // un lecteur ne peut pas importer
  assert.equal((await send(Buffer.from('<svg><script>alert(1)</script></svg>'))).status, 400); // faux PNG
  assert.equal((await send(Buffer.alloc(3 * 1024 * 1024, 1))).status, 413); // trop lourd

  const ok = await send(png);
  assert.equal(ok.status, 200);
  assert.ok((await ok.json()).data.book.coverUploadedAt);

  const pub = await fetch(`${base}/books/${id}/cover`); // lecture publique, sans cookie
  assert.equal(pub.status, 200);
  assert.equal(pub.headers.get('content-type'), 'image/png');
  assert.equal(pub.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal((await pub.arrayBuffer()).byteLength, png.length);

  const list = await client().get('/books'); // la liste ne contient jamais les octets de l'image
  assert.ok(list.body.data.books.every((b) => !('coverData' in b)));

  const { Book } = await import('../src/models/Book.js');
  await Book.updateOne({ _id: id }, { isPublished: false });
  assert.equal((await fetch(`${base}/books/${id}/cover`)).status, 404); // livre non publié : invisible au public
  await Book.updateOne({ _id: id }, { isPublished: true });

  assert.equal((await admin.del(`/books/${id}/cover`)).status, 200);
  assert.equal((await fetch(`${base}/books/${id}/cover`)).status, 404);
});

test('administrateur : ?scope=public renvoie la vue lecteur (sans bonne réponse, avec id)', { skip }, async () => {
  const list = await admin.get('/questions?scope=public');
  assert.equal(list.status, 200);
  assert.ok(list.body.data.questions.length > 0);
  for (const q of list.body.data.questions) {
    assert.equal('correctAnswer' in q, false);
    assert.ok(q.id);
  }
  const one = await admin.get(`/questions/${ctx.qYesterday._id}?scope=public`);
  assert.equal(one.status, 200);
  assert.equal('correctAnswer' in one.body.data.question, false);
  const full = await admin.get(`/questions/${ctx.qYesterday._id}`); // sans scope : vue administrateur
  assert.equal(full.body.data.question.correctAnswer, 2);
});
