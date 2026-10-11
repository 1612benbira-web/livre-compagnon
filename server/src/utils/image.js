// Détecte le vrai format d'une image à partir de ses premiers octets.
// Seuls PNG, JPEG et WebP sont acceptés (pas de SVG : il peut contenir du script).
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function sniffImage(buf) {
  if (!Buffer.isBuffer(buf)) return null;
  if (buf.length > 8 && buf.subarray(0, 8).equals(PNG)) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export const MAX_COVER_BYTES = 2 * 1024 * 1024;
