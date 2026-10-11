// Test de fumée sans navigateur : rend les pages côté serveur et vérifie les schémas de validation.
// Usage : npm run test:smoke (depuis client/)
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let failures = 0;
const check = (name, cond) => { console.log((cond ? 'OK   ' : 'FAIL ') + name); if (!cond) failures++; };

try {
  const { StaticRouter } = await import('react-router-dom');
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  const { AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx');

  for (const path of ['/', '/connexion', '/inscription', '/confidentialite', '/question-du-jour', '/questions', '/questions/abc', '/espace', '/admin', '/admin/connexion', '/page-inexistante']) {
    try {
      const html = renderToString(React.createElement(StaticRouter, { location: path }, React.createElement(AuthProvider, null, React.createElement(App))));
      check(`rendu ${path} (${html.length} octets)`, html.length > 100);
    } catch (e) { check(`rendu ${path} : ${e.message}`, false); }
  }

  const s = await vite.ssrLoadModule('/src/utils/schemas.js');
  const good = { firstName: 'Awa', email: 'awa@test.sn', password: 'motdepasse1', confirmPassword: 'motdepasse1', acceptTerms: true };
  check('registerSchema accepte des données valides', s.registerSchema.safeParse(good).success);
  check('registerSchema refuse mot de passe faible', !s.registerSchema.safeParse({ ...good, password: 'abc', confirmPassword: 'abc' }).success);
  check('registerSchema refuse confirmation différente', !s.registerSchema.safeParse({ ...good, confirmPassword: 'autre123x' }).success);
  check('registerSchema exige acceptTerms', !s.registerSchema.safeParse({ ...good, acceptTerms: false }).success);
  const q = { book: 'abc', question: 'Quelle attitude ?', answers: ['a', 'b', 'c', 'd'], correctAnswer: '2', explanation: '', status: 'draft', publicationDate: '' };
  const parsed = s.questionFormSchema.safeParse(q);
  check('questionFormSchema accepte et convertit correctAnswer en nombre', parsed.success && parsed.data.correctAnswer === 2);
  check('questionFormSchema refuse une proposition vide', !s.questionFormSchema.safeParse({ ...q, answers: ['a', '', 'c', 'd'] }).success);

  // Formulaire de livre (création) rendu directement, hors garde d'administration
  const { BookForm } = await vite.ssrLoadModule('/src/pages/admin/AdminBookForm.jsx');
  const formHtml = renderToString(React.createElement(StaticRouter, { location: '/admin/livres/nouveau' }, React.createElement(BookForm, { book: null })));
  check('formulaire de livre : champs titre, slug et publication', formHtml.includes('id="title"') && formHtml.includes('id="slug"') && formHtml.includes('Créer le livre et son QR code'));
  const { slugify } = await vite.ssrLoadModule('/src/utils/slugify.js');
  check('slugify : « Mon Été Magique ! » → mon-ete-magique', slugify('Mon Été Magique !') === 'mon-ete-magique');
  const book = { title: 'Mon livre', slug: 'mon-livre', description: '', author: '', coverImage: '/images/c.jpg', isPublished: true };
  check('bookFormSchema accepte un livre valide', s.bookFormSchema.safeParse(book).success);
  check('bookFormSchema refuse un slug avec espace/accent', !s.bookFormSchema.safeParse({ ...book, slug: 'mon livre é' }).success);
  check('bookFormSchema refuse une image en http', !s.bookFormSchema.safeParse({ ...book, coverImage: 'http://x.y/a.jpg' }).success);

  const cv = await vite.ssrLoadModule('/src/utils/cover.js');
  const f1 = cv.fitWithin(4000, 3000), f2 = cv.fitWithin(800, 1000), f3 = cv.fitWithin(1000, 4000);
  check('fitWithin réduit sans déformer (4000x3000 → 1200x900)', f1.width === 1200 && f1.height === 900);
  check('fitWithin n’agrandit jamais (800x1000 inchangé)', f2.width === 800 && f2.height === 1000);
  check('fitWithin gère les images très hautes (1000x4000 → 300x1200)', f3.width === 300 && f3.height === 1200);
  check('coverSrc : image importée → adresse de l’API versionnée', /\/books\/abc\/cover\?v=\d+$/.test(cv.coverSrc({ _id: 'abc', coverUploadedAt: '2026-10-11T00:00:00Z', coverImage: '/x.jpg' })));
  check('coverSrc : sans import → adresse saisie', cv.coverSrc({ _id: 'abc', coverImage: '/x.jpg' }) === '/x.jpg');
  check('coverSrc : rien → chaîne vide', cv.coverSrc({ _id: 'abc' }) === '');
  check('formulaire de livre : champ d’import d’image', formHtml.includes('type="file"') && formHtml.includes('image/png,image/jpeg,image/webp'));

  // Carte de question rendue directement (états « à faire » et « déjà répondue »)
  const { default: QuestionCard } = await vite.ssrLoadModule('/src/components/questions/QuestionCard.jsx');
  const sample = { id: '1', question: 'Quelle est la capitale du Sénégal ?', answers: ['Thiès', 'Dakar', 'Saint-Louis', 'Kaolack'] };
  const wrap = (props) => renderToString(React.createElement(StaticRouter, { location: '/questions/1' }, React.createElement(AuthProvider, null, React.createElement(QuestionCard, props))));
  const todo = wrap({ question: sample, alreadyAnswered: false });
  check('QuestionCard à faire : 4 propositions et bouton Valider', (todo.match(/type="radio"/g) || []).length === 4 && todo.includes('Valider ma réponse') && !todo.includes('Déjà répondue'));
  const done = wrap({ question: sample, alreadyAnswered: true, answerId: 'xyz' });
  check('QuestionCard répondue : badge et lien vers le résultat', done.includes('Déjà répondue') && done.includes('/resultat/xyz') && !done.includes('Valider ma réponse'));
  const { questionService } = await vite.ssrLoadModule('/src/services/content.js');
  check('questionService.list et get existent', typeof questionService.list === 'function' && typeof questionService.get === 'function');

  const { zodResolver } = await import('@hookform/resolvers/zod');
  const res = await zodResolver(s.loginSchema)({ email: 'pas-un-email', password: '' }, undefined, { fields: {}, shouldUseNativeValidation: false });
  check('zodResolver renvoie des erreurs par champ', !!res.errors.email && !!res.errors.password);
} catch (e) { console.log('ERREUR GLOBALE', e); failures++; }
await vite.close();
process.exit(failures ? 1 : 0);
