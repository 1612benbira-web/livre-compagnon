import { API_BASE } from '../services/api.js';

export const MAX_SIDE = 1200; // px : largement suffisant pour une couverture affichée à ~300 px
export const MAX_BYTES = 2 * 1024 * 1024; // même limite que le serveur
export const ACCEPT = 'image/png,image/jpeg,image/webp';

// Adresse d'affichage : l'image importée (stockée sur le serveur) prime sur l'adresse saisie
export const coverSrc = (book) =>
  book?.coverUploadedAt
    ? `${API_BASE}/books/${book._id}/cover?v=${new Date(book.coverUploadedAt).getTime()}`
    : book?.coverImage || '';

// Réduit sans déformer ni agrandir
export function fitWithin(width, height, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Redimensionne et recompresse en JPEG dans le navigateur : une photo de téléphone de 5 Mo devient ~200 Ko.
export async function prepareCover(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choisis un fichier image.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Image illisible ou format non pris en charge (utilise PNG, JPEG ou WebP).');
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // fond blanc pour les PNG transparents
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
  if (!blob) throw new Error('Impossible de préparer l’image.');
  if (blob.size > MAX_BYTES) throw new Error('Image trop lourde même après compression : choisis une image plus petite.');
  return blob;
}
