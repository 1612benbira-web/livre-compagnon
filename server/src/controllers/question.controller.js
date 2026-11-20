import { Answer } from '../models/Answer.js';
import { Book } from '../models/Book.js';
import { Question } from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dateKeyFor, todayUTCDate } from '../utils/dates.js';
import { paginationMeta } from '../utils/pagination.js';
import { created, ok } from '../utils/response.js';
import { availableFilter, findTodayQuestion, resolveBook } from '../services/question.service.js';

const isAdmin = (req) => req.user?.role === 'admin';

// Nombre de réponses par question (affiché à l'administrateur pour expliquer les champs verrouillés)
async function answerCounts(ids) {
  const rows = await Answer.aggregate([
    { $match: { question: { $in: ids } } },
    { $group: { _id: '$question', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

// Champs protégés dès qu'au moins une réponse a été enregistrée (cohérence de l'historique)
const LOCKED_FIELDS = ['book', 'answers', 'correctAnswer'];

export const listQuestions = asyncHandler(async (req, res) => {
  const { page, limit, status, book, scope } = req.validated.query;
  const admin = isAdmin(req) && scope !== 'public';
  // Les filtres sont construits côté serveur : jamais de filtre Mongo fourni par le client
  const filter = admin ? {} : await availableFilter();
  if (admin && status) filter.status = status;
  // Lecteur : le filtre "livre" s'ajoute à la restriction aux livres publiés, sans la remplacer
  if (book) {
    if (admin) filter.book = book;
    else filter.$and = [{ book }];
  }

  const [total, docs] = await Promise.all([
    Question.countDocuments(filter),
    Question.find(filter)
      .sort({ publicationDate: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  let answeredMap = new Map(); // id de question → id de la réponse de l'utilisateur
  if (req.user && docs.length) {
    const answers = await Answer.find({ user: req.user._id, question: { $in: docs.map((d) => d._id) } }, 'question');
    answeredMap = new Map(answers.map((a) => [a.question.toString(), a._id]));
  }

  const counts = admin ? await answerCounts(docs.map((d) => d._id)) : null;
  const questions = docs.map((q) =>
    admin
      ? { ...q.toJSON(), answerCount: counts.get(q._id.toString()) ?? 0 }
      : {
          ...q.toPublic(),
          alreadyAnswered: answeredMap.has(q._id.toString()),
          answerId: answeredMap.get(q._id.toString()) ?? null,
        }
  );
  return ok(res, { questions, pagination: paginationMeta(page, limit, total) });
});

export const getTodayQuestion = asyncHandler(async (req, res) => {
  const dateKey = dateKeyFor();
  const book = await resolveBook(req.validated.query.book);
  if (!book) return ok(res, { question: null, dateKey }, 'Aucune question disponible.');

  const { question, isFallback } = await findTodayQuestion(book._id);
  if (!question) return ok(res, { question: null, book, dateKey }, 'Aucune question disponible.');

  let answer = null;
  if (req.user) answer = await Answer.findOne({ user: req.user._id, question: question._id }, '_id');

  return ok(res, {
    question: question.toPublic(),
    book,
    dateKey,
    isFallback,
    alreadyAnswered: Boolean(answer),
    answerId: answer?._id ?? null,
  });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question introuvable.');
  if (isAdmin(req) && req.validated?.query?.scope !== 'public') {
    const answerCount = await Answer.countDocuments({ question: question._id });
    return ok(res, { question: { ...question.toJSON(), answerCount } });
  }

  const available =
    question.status === 'published' &&
    question.publicationDate &&
    question.publicationDate <= todayUTCDate() &&
    (await Book.exists({ _id: question.book, isPublished: true }));
  if (!available) throw new ApiError(404, 'Question introuvable.');

  let answer = null;
  if (req.user) answer = await Answer.findOne({ user: req.user._id, question: question._id }, '_id');
  return ok(res, { question: question.toPublic(), alreadyAnswered: Boolean(answer), answerId: answer?._id ?? null });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!(await Book.exists({ _id: data.book }))) throw new ApiError(400, 'Livre inconnu.', [{ field: 'book', message: 'Livre inconnu.' }]);
  if (data.status === 'published' && !data.publicationDate) data.publicationDate = todayUTCDate();
  const question = await Question.create(data);
  return created(res, { question }, 'Question créée.');
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question introuvable.');

  const hasAnswers = await Answer.exists({ question: question._id });
  if (hasAnswers) {
    const forbidden = LOCKED_FIELDS.filter((f) => f in req.body);
    if (forbidden.length) {
      throw new ApiError(
        409,
        'Cette question a déjà reçu des réponses : ses propositions et sa bonne réponse ne peuvent plus être modifiées. Archive-la et crée une nouvelle question.',
        forbidden.map((f) => ({ field: f, message: 'Champ verrouillé.' }))
      );
    }
  }
  if (req.body.book && !(await Book.exists({ _id: req.body.book }))) {
    throw new ApiError(400, 'Livre inconnu.', [{ field: 'book', message: 'Livre inconnu.' }]);
  }

  question.set(req.body);
  if (question.status === 'published' && !question.publicationDate) question.publicationDate = todayUTCDate();
  await question.save(); // exécute les validateurs du schéma
  return ok(res, { question }, 'Question modifiée.');
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new ApiError(404, 'Question introuvable.');
  if (await Answer.exists({ question: question._id })) {
    throw new ApiError(409, 'Cette question a déjà reçu des réponses : archive-la au lieu de la supprimer.');
  }
  await question.deleteOne();
  return ok(res, null, 'Question supprimée.');
});
