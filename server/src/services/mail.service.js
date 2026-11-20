import { env } from '../config/env.js';

// Envoi d'emails via l'API HTTP de Resend (https://resend.com/docs/api-reference/emails/send-email).
// Sans RESEND_API_KEY :
//  - en développement, l'email est affiché dans la console (lien utilisable en local) ;
//  - en test, il est conservé dans `sentEmails` pour les vérifications ;
//  - en production, l'envoi échoue (erreur journalisée côté serveur, jamais renvoyée au client).

export const sentEmails = []; // utilisé uniquement par les tests

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function sendEmail({ to, subject, html, text }) {
  if (env.nodeEnv === 'test') {
    sentEmails.push({ to, subject, html, text });
    return;
  }
  if (!env.resendApiKey) {
    if (env.isProd) throw new Error('RESEND_API_KEY manquante : email non envoyé.');
    console.log(`\n[email de développement] À : ${to}\nObjet : ${subject}\n${text}\n`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.emailFrom, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend a refusé l'email (${res.status}) : ${detail.slice(0, 300)}`);
  }
}

export function resetPasswordEmail({ firstName, url, minutes }) {
  const name = escapeHtml(firstName);
  const safeUrl = escapeHtml(url);
  return {
    subject: 'Réinitialiser ton mot de passe',
    text:
      `Bonjour ${firstName},\n\n` +
      `Tu as demandé à changer ton mot de passe. Ouvre ce lien pour en choisir un nouveau (valable ${minutes} minutes) :\n${url}\n\n` +
      'Si tu n’as rien demandé, ignore simplement cet email : ton mot de passe ne change pas.',
    html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1f2d3d">
  <p>Bonjour ${name},</p>
  <p>Tu as demandé à changer ton mot de passe. Clique sur le bouton pour en choisir un nouveau. Ce lien est valable <strong>${minutes} minutes</strong> et ne fonctionne qu’une fois.</p>
  <p><a href="${safeUrl}" style="display:inline-block;background:#2f6fb0;color:#ffffff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Choisir un nouveau mot de passe</a></p>
  <p style="font-size:14px;color:#555">Si le bouton ne marche pas, copie ce lien dans ton navigateur :<br>${safeUrl}</p>
  <p style="font-size:14px;color:#555">Si tu n’as rien demandé, ignore simplement cet email : ton mot de passe ne change pas.</p>
</div>`,
  };
}
