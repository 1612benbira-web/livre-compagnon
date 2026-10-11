import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_COVER_BYTES, sniffImage } from '../src/utils/image.js';

test('sniffImage reconnaît PNG, JPEG et WebP par leurs octets', () => {
  assert.equal(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])), 'image/png');
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])), 'image/jpeg');
  assert.equal(sniffImage(Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBPVP8 ')])), 'image/webp');
});

test('sniffImage refuse SVG, HTML, texte et corps vides', () => {
  assert.equal(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(sniffImage(Buffer.from('<html><script>alert(1)</script></html>')), null);
  assert.equal(sniffImage(Buffer.from('GIF89a......')), null);
  assert.equal(sniffImage(Buffer.alloc(0)), null);
  assert.equal(sniffImage(undefined), null);
  assert.equal(sniffImage({}), null);
});

test('la limite de taille est de 2 Mo', () => {
  assert.equal(MAX_COVER_BYTES, 2 * 1024 * 1024);
});
