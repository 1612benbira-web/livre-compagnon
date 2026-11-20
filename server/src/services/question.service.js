import { Book } from '../models/Book.js';
import { Question } from '../models/Question.js';
import { todayUTCDate } from '../utils/dates.js';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Une question est disponible si elle est publiée, si sa date de publication est atteinte
// et si son livre est lui-même publié (un livre en préparation ne doit rien exposer aux lecteurs).
export const availableFilter = async (now = new Date()) => ({
  status: 'published',
  publicationDate: { $lte: todayUTCDate(now) },
  book: { $in: await Book.distinct('_id', { isPublished: true }) },
});

export const findBookByIdOrSlug = (idOrSlug) =>
  OBJECT_ID.test(idOrSlug) ? Book.findById(idOrSlug) : Book.findOne({ slug: idOrSlug.toLowerCase() });

// Livre demandé (id ou slug), sinon le plus ancien livre publié (configuration "livre unique")
export async function resolveBook(idOrSlug) {
  if (idOrSlug) {
    const book = await findBookByIdOrSlug(idOrSlug);
    return book?.isPublished ? book : null;
  }
  return Book.findOne({ isPublished: true }).sort({ createdAt: 1, _id: 1 });
}

// Règle de la question du jour :
// 1) question publiée dont publicationDate = aujourd'hui (fuseau APP_TIMEZONE) ;
// 2) sinon repli : la dernière question publiée dont la date est passée.
// Même date + même livre => même question pour tous (tri déterministe par _id).
export async function findTodayQuestion(bookId, now = new Date()) {
  const today = todayUTCDate(now);
  const exact = await Question.findOne({ book: bookId, status: 'published', publicationDate: today }).sort({ _id: 1 });
  if (exact) return { question: exact, isFallback: false };
  const fallback = await Question.findOne({
    book: bookId,
    status: 'published',
    publicationDate: { $lte: today },
  }).sort({ publicationDate: -1, _id: 1 });
  return { question: fallback, isFallback: Boolean(fallback) };
}
