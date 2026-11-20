import { Answer } from '../models/Answer.js';
import { Question } from '../models/Question.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationMeta } from '../utils/pagination.js';
import { created, ok } from '../utils/response.js';
import { availableFilter } from '../services/question.service.js';

// Résultat complet : correctAnswer et explication ne sortent qu'ici, après enregistrement de la tentative
const toResult = (answer, question) => ({
  id: answer._id,
  question: question
    ? { id: question._id, question: question.question, answers: question.answers }
    : null,
  selectedAnswer: answer.selectedAnswer,
  correctAnswer: question?.correctAnswer ?? null,
  isCorrect: answer.isCorrect,
  explanation: question?.explanation ?? '',
  answeredAt: answer.answeredAt,
});

export const createAnswer = asyncHandler(async (req, res) => {
  const { questionId, selectedAnswer } = req.body;

  const question = await Question.findOne({ _id: questionId, ...(await availableFilter()) });
  if (!question) throw new ApiError(404, 'Question introuvable ou non disponible.');
  if (selectedAnswer >= question.answers.length) {
    throw new ApiError(400, 'Proposition invalide.', [{ field: 'selectedAnswer', message: 'Proposition invalide.' }]);
  }

  // La correction est toujours calculée ici ; le client ne peut pas imposer isCorrect
  const isCorrect = selectedAnswer === question.correctAnswer;

  let answer;
  try {
    answer = await Answer.create({
      user: req.user._id,
      question: question._id,
      book: question.book,
      selectedAnswer,
      isCorrect,
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Tu as déjà répondu à cette question.');
    throw err;
  }
  return created(res, { result: toResult(answer, question) }, 'Réponse enregistrée.');
});

export const getAnswer = asyncHandler(async (req, res) => {
  // Filtre sur l'utilisateur : une réponse d'un autre est indistinguable d'une réponse inexistante
  const answer = await Answer.findOne({ _id: req.params.id, user: req.user._id }).populate('question');
  if (!answer) throw new ApiError(404, 'Réponse introuvable.');
  return ok(res, { result: toResult(answer, answer.question) });
});

export const getHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.validated.query;
  const filter = { user: req.user._id };
  const [total, answers] = await Promise.all([
    Answer.countDocuments(filter),
    Answer.find(filter)
      .sort({ answeredAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('question'),
  ]);
  return ok(res, {
    history: answers.map((a) => toResult(a, a.question)),
    pagination: paginationMeta(page, limit, total),
  });
});

export const getProgress = asyncHandler(async (req, res) => {
  const [agg] = await Answer.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        answered: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        days: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$answeredAt', timezone: env.timezone } } },
      },
    },
  ]);
  const answered = agg?.answered ?? 0;
  const correct = agg?.correct ?? 0;
  const availableQuestions = await Question.countDocuments(await availableFilter());

  return ok(res, {
    answered,
    correct,
    incorrect: answered - correct,
    // Taux de réussite = bonnes réponses / réponses données
    successRate: answered ? Math.round((correct / answered) * 100) : 0,
    // Progression = part des questions disponibles auxquelles l'utilisateur a répondu
    progressPercent: availableQuestions ? Math.min(100, Math.round((answered / availableQuestions) * 100)) : 0,
    availableQuestions,
    activeDays: agg?.days.length ?? 0,
  });
});
