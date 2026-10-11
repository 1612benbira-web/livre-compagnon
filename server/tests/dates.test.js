import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/x_test';
process.env.JWT_SECRET = 'x'.repeat(48);
process.env.CLIENT_URL = 'http://localhost:5173';

const { dateKeyFor, dateKeyToUTCDate, isValidDateKey, todayUTCDate } = await import('../src/utils/dates.js');
const { slugify } = await import('../src/utils/slugify.js');

test('le jour dépend du fuseau de référence, pas de l\'horloge locale', () => {
  const instant = new Date('2026-10-10T23:30:00Z');
  assert.equal(dateKeyFor(instant, 'Africa/Dakar'), '2026-10-10');
  assert.equal(dateKeyFor(instant, 'Pacific/Auckland'), '2026-10-11');
});

test('todayUTCDate renvoie minuit UTC du jour de référence', () => {
  const d = todayUTCDate(new Date('2026-10-10T23:30:00Z'), 'Pacific/Auckland');
  assert.equal(d.toISOString(), '2026-10-11T00:00:00.000Z');
});

test('isValidDateKey refuse les dates impossibles', () => {
  assert.equal(isValidDateKey('2026-10-10'), true);
  assert.equal(isValidDateKey('2026-02-30'), false);
  assert.equal(isValidDateKey('10/10/2026'), false);
  assert.equal(dateKeyToUTCDate('2026-10-10').toISOString(), '2026-10-10T00:00:00.000Z');
});

test('slugify retire accents et caractères spéciaux', () => {
  assert.equal(slugify('Mon Premier Livre : l\'été !'), 'mon-premier-livre-l-ete');
});
