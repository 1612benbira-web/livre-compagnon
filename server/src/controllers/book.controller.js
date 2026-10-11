import { Book } from '../models/Book.js';
import { Question } from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/response.js';
import { slugify } from '../utils/slugify.js';
import { findBookByIdOrSlug } from '../services/question.service.js';
import { bookUrl, isHttps, qrPng, qrSvg } from '../services/qr.service.js';
import { sniffImage } from '../utils/image.js';

const isAdmin = (req) => req.user?.role === 'admin';

export const listBooks = asyncHandler(async (req, res) => {
  const filter = isAdmin(req) ? {} : { isPublished: true };
  const books = await Book.find(filter).sort({ createdAt: 1 });
  return ok(res, { books });
});

export const getBook = asyncHandler(async (req, res) => {
  const book = await findBookByIdOrSlug(req.params.id);
  if (!book || (!book.isPublished && !isAdmin(req))) throw new ApiError(404, 'Livre introuvable.');
  return ok(res, { book });
});

export const createBook = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  data.slug = data.slug || slugify(data.title);
  if (!data.slug) throw new ApiError(400, 'Impossible de générer un slug : précise-en un.');
  const book = await Book.create(data);
  return created(res, { book }, 'Livre créé.');
});

export const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
  if (!book) throw new ApiError(404, 'Livre introuvable.');
  return ok(res, { book }, 'Livre modifié.');
});

export const deleteBook = asyncHandler(async (req, res) => {
  if (await Question.exists({ book: req.params.id })) {
    throw new ApiError(409, 'Ce livre contient des questions : dépublie-le plutôt que de le supprimer.');
  }
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) throw new ApiError(404, 'Livre introuvable.');
  return ok(res, null, 'Livre supprimé.');
});

// QR code d'un livre, dérivé de son slug (rien n'est stocké : le même slug donne toujours le même QR code)
export const getBookQr = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Livre introuvable.');
  const url = bookUrl(book.slug);
  const { format } = req.validated.query;

  if (format === 'png') {
    res.set({ 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="qr-${book.slug}.png"` });
    return res.send(await qrPng(url));
  }
  if (format === 'svg') {
    res.set({ 'Content-Type': 'image/svg+xml', 'Content-Disposition': `attachment; filename="qr-${book.slug}.svg"` });
    return res.send(await qrSvg(url));
  }
  return ok(res, { url, https: isHttps(url), published: book.isPublished, slug: book.slug, svg: await qrSvg(url) });
});

// --- Image de couverture importée ---

export const uploadCover = asyncHandler(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new ApiError(400, 'Aucune image reçue (PNG, JPEG ou WebP, 2 Mo maximum).');
  }
  const mime = sniffImage(req.body);
  if (!mime) throw new ApiError(400, 'Format d\'image non pris en charge (PNG, JPEG ou WebP).');

  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { coverData: req.body, coverMime: mime, coverUploadedAt: new Date() },
    { returnDocument: 'after' }
  );
  if (!book) throw new ApiError(404, 'Livre introuvable.');
  return ok(res, { book }, 'Image enregistrée.');
});

export const deleteCover = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { $unset: { coverData: 1, coverMime: 1, coverUploadedAt: 1 } },
    { returnDocument: 'after' }
  );
  if (!book) throw new ApiError(404, 'Livre introuvable.');
  return ok(res, { book }, 'Image supprimée.');
});

export const getCover = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).select('+coverData +coverMime isPublished');
  if (!book?.coverData || (!book.isPublished && !isAdmin(req))) throw new ApiError(404, 'Image introuvable.');
  res.set({
    'Content-Type': book.coverMime,
    // L'adresse change à chaque nouvel import (?v=date) : cache long possible pour un livre publié
    'Cache-Control': book.isPublished ? 'public, max-age=31536000, immutable' : 'private, no-store',
    // Le frontend peut être sur une autre origine que l'API (Helmet bloque sinon l'affichage de l'image)
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  return res.send(Buffer.from(book.coverData));
});
