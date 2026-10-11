import { env } from '../config/env.js';

// Clé de jour "YYYY-MM-DD" dans le fuseau de référence (APP_TIMEZONE), jamais l'horloge du navigateur
export function dateKeyFor(date = new Date(), timeZone = env.timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Les jours de publication sont stockés à minuit UTC du jour calendaire de référence
export const dateKeyToUTCDate = (key) => new Date(`${key}T00:00:00.000Z`);

export const todayUTCDate = (now = new Date(), timeZone = env.timezone) =>
  dateKeyToUTCDate(dateKeyFor(now, timeZone));

export const isValidDateKey = (s) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(`${s}T00:00:00.000Z`)) &&
  dateKeyToUTCDate(s).toISOString().startsWith(s);
