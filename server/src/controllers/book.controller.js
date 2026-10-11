import { Book } from '../models/Book.js';
import { Question } from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/response.js';
import { slugify } from '../utils/slugify.js';
import { findBookByIdOrSlug } from '../services/question.service.js';

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
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
