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

  for (const path of ['/', '/connexion', '/inscription', '/confidentialite', '/question-du-jour', '/espace', '/admin', '/admin/connexion', '/page-inexistante']) {
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

  const { zodResolver } = await import('@hookform/resolvers/zod');
  const res = await zodResolver(s.loginSchema)({ email: 'pas-un-email', password: '' }, undefined, { fields: {}, shouldUseNativeValidation: false });
  check('zodResolver renvoie des erreurs par champ', !!res.errors.email && !!res.errors.password);
} catch (e) { console.log('ERREUR GLOBALE', e); failures++; }
await vite.close();
process.exit(failures ? 1 : 0);
