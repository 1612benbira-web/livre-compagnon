// Tests sans base de données : valident ce qui ne dépend pas de MongoDB.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/livre_compagnon_test';
process.env.JWT_SECRET = 'x'.repeat(48);
process.env.CLIENT_URL = 'http://localhost:5173';

let server;
let base;

before(async () => {
  const { default: app } = await import('../src/app.js');
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

const post = (path, body, headers = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

test('GET /health renvoie 503 si MongoDB n\'est pas connecté', async () => {
  const res = await fetch(base + '/health');
  assert.equal(res.status, 503);
  assert.equal((await res.json()).data.db, 'disconnected');
});

test('GET /auth/me sans cookie → 401', async () => {
  assert.equal((await fetch(base + '/auth/me')).status, 401);
});

test('GET /auth/me avec un jeton falsifié → 401', async () => {
  const res = await fetch(base + '/auth/me', { headers: { Cookie: 'token=abc.def.ghi' } });
  assert.equal(res.status, 401);
});

test('register : mot de passe faible et confirmation différente → 400', async () => {
  const res = await post('/auth/register', {
    firstName: 'Awa', email: 'awa@example.com', password: 'abc', confirmPassword: 'xyz',
  });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.length >= 2);
});

test('register : un champ "role" envoyé par le client est refusé', async () => {
  const res = await post('/auth/register', {
    firstName: 'Awa', email: 'awa@example.com', password: 'motdepasse1',
    confirmPassword: 'motdepasse1', role: 'admin',
  });
  assert.equal(res.status, 400);
});

test('requête POST depuis une origine non autorisée → 403', async () => {
  const res = await post('/auth/login', { email: 'a@b.co', password: 'x' }, { Origin: 'http://evil.example' });
  assert.equal(res.status, 403);
});

test('route inconnue → 404 au format JSON', async () => {
  const res = await fetch(base + '/inconnue');
  assert.equal(res.status, 404);
  assert.equal((await res.json()).success, false);
});

test('en-têtes de sécurité Helmet présents, x-powered-by absent', async () => {
  const res = await fetch(base + '/health');
  assert.ok(res.headers.get('x-content-type-options'));
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('GET /questions : paramètres de pagination invalides → 400', async () => {
  assert.equal((await fetch(base + '/questions?page=abc')).status, 400);
  assert.equal((await fetch(base + '/questions?limit=500')).status, 400);
});

test('GET /questions : paramètre inconnu (filtre Mongo injecté) → 400', async () => {
  const res = await fetch(base + '/questions?status[$ne]=draft');
  assert.equal(res.status, 400);
});

test('GET /questions/:id avec un identifiant invalide → 400', async () => {
  assert.equal((await fetch(base + '/questions/pas-un-id')).status, 400);
});

test('POST /answers sans authentification → 401', async () => {
  const res = await post('/answers', { questionId: 'a'.repeat(24), selectedAnswer: 1 });
  assert.equal(res.status, 401);
});

test('GET /answers/progress et /history sans authentification → 401', async () => {
  assert.equal((await fetch(base + '/answers/progress')).status, 401);
  assert.equal((await fetch(base + '/answers/history')).status, 401);
});

test('POST /questions et /books sans authentification → 401', async () => {
  assert.equal((await post('/questions', {})).status, 401);
  assert.equal((await post('/books', {})).status, 401);
});

test('routes /admin/* sans authentification → 401', async () => {
  for (const path of ['/admin/dashboard', '/admin/users', '/admin/answers']) {
    assert.equal((await fetch(base + path)).status, 401, path);
  }
});

test('profil, mot de passe et suppression de compte sans authentification → 401', async () => {
  const send = (method, path) =>
    fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal((await send('PATCH', '/auth/profile')).status, 401);
  assert.equal((await send('PUT', '/auth/password')).status, 401);
  assert.equal((await send('DELETE', '/auth/account')).status, 401);
});

