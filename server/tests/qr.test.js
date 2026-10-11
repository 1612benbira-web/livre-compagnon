import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/x_test';
process.env.JWT_SECRET = 'x'.repeat(48);
process.env.CLIENT_URL = 'https://monlivre.example/';

const { bookUrl, isHttps, qrPng, qrSvg } = await import('../src/services/qr.service.js');

test('bookUrl : base publique sans slash final + /livre/<slug>', () => {
  assert.equal(bookUrl('livre-1'), 'https://monlivre.example/livre/livre-1');
});

test('isHttps distingue HTTPS et HTTP', () => {
  assert.equal(isHttps('https://a.b/livre/x'), true);
  assert.equal(isHttps('http://localhost:5173/livre/x'), false);
});

test('qrPng produit une vraie image PNG', async () => {
  const buf = await qrPng(bookUrl('livre-1'));
  assert.deepEqual([...buf.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
});

test('qrSvg produit un SVG', async () => {
  assert.match(await qrSvg(bookUrl('livre-1')), /<svg/);
});

test('le même slug donne toujours le même QR code', async () => {
  assert.equal(await qrSvg(bookUrl('livre-1')), await qrSvg(bookUrl('livre-1')));
});
