import QRCode from 'qrcode';
import { env } from '../config/env.js';

const OPTIONS = { margin: 2, errorCorrectionLevel: 'H' }; // correction d'erreurs maximale (lisible même abîmé)

// Adresse stable encodée dans le QR code : base publique + /livre/<slug>
export const bookUrl = (slug) => `${env.publicBaseUrl}/livre/${encodeURIComponent(slug)}`;

// Un QR code imprimé doit pointer vers une adresse HTTPS publique
export const isHttps = (url) => url.startsWith('https://');

export const qrSvg = (url) => QRCode.toString(url, { ...OPTIONS, type: 'svg' });

export const qrPng = (url) => QRCode.toBuffer(url, { ...OPTIONS, type: 'png', width: 1200 });
