// Usage : npm run qr -- https://ton-domaine.com/livre/livre-demo [sortie.png]
// Génère un QR code stable (PNG haute résolution + SVG) à imprimer dans le livre.
import QRCode from 'qrcode';

const [url, out = 'qr-livre.png'] = process.argv.slice(2);
if (!url || !/^https:\/\//.test(url)) {
  console.error('Fournis une URL HTTPS publique : npm run qr -- https://ton-domaine.com/livre/identifiant');
  process.exit(1);
}
await QRCode.toFile(out, url, { width: 1200, margin: 2, errorCorrectionLevel: 'H' });
await QRCode.toFile(out.replace(/\.png$/, '') + '.svg', url, { type: 'svg', margin: 2, errorCorrectionLevel: 'H' });
console.log(`QR code créé : ${out} (+ .svg) → ${url}`);
