import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET doit contenir au moins 32 caractères.');
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL,
  timezone: process.env.APP_TIMEZONE || 'Africa/Dakar',
  // lax (même site ou proxy /api), none (frontend et API sur des domaines différents, HTTPS obligatoire)
  // Base des adresses encodées dans les QR codes (défaut : CLIENT_URL). Domaine définitif en production.
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || process.env.CLIENT_URL).replace(/\/+$/, ''),
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 10, // tentatives par 15 minutes et par IP
  // Envoi d'emails (mot de passe oublié) via Resend
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Livre compagnon <onboarding@resend.dev>',
  cookieSameSite: ['lax', 'strict', 'none'].includes(process.env.COOKIE_SAMESITE) ? process.env.COOKIE_SAMESITE : 'lax',
};
