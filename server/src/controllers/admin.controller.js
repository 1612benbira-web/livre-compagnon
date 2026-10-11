import { Answer } from '../models/Answer.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationMeta } from '../utils/pagination.js';
import { ok } from '../utils/response.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

export const getDashboard = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalUsers, totalQuestions, publishedQuestions, totalAnswers, correctAnswers, activeUserIds, recent] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Question.countDocuments(),
      Question.countDocuments({ status: 'published' }),
      Answer.countDocuments(),
      Answer.countDocuments({ isCorrect: true }),
      Answer.distinct('user', { answeredAt: { $gte: since } }),
      Answer.find().sort({ answeredAt: -1, _id: -1 }).limit(8).populate('user', 'firstName').populate('question', 'question'),
    ]);

  return ok(res, {
    totalUsers,
    totalQuestions,
    publishedQuestions,
    totalAnswers,
    successRate: percent(correctAnswers, totalAnswers),
    activeUsersLast7Days: activeUserIds.length,
    recentAnswers: recent.map((a) => ({
      id: a._id,
      firstName: a.user?.firstName ?? 'Compte supprimé',
      question: a.question?.question ?? '—',
      isCorrect: a.isCorrect,
      answeredAt: a.answeredAt,
    })),
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.validated.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i'); // regex construite côté serveur, entrée échappée
    filter.$or = [{ firstName: rx }, { email: rx }];
  }
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  const stats = await Answer.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$user', answered: { $sum: 1 }, correct: { $sum: { $cond: ['$isCorrect', 1, 0] } } } },
  ]);
  const byUser = new Map(stats.map((s) => [s._id.toString(), s]));

  return ok(res, {
    users: users.map((u) => {
      const s = byUser.get(u._id.toString()) ?? { answered: 0, correct: 0 };
      return {
        id: u._id,
        firstName: u.firstName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        answered: s.answered,
        correct: s.correct,
        successRate: percent(s.correct, s.answered),
      };
    }),
    pagination: paginationMeta(page, limit, total),
  });
});

export const listAnswers = asyncHandler(async (req, res) => {
  const { page, limit, user, question, from, to, result } = req.validated.query;
  const filter = {};
  if (user) filter.user = user;
  if (question) filter.question = question;
  if (result) filter.isCorrect = result === 'correct';
  // Les bornes de dates sont comparées au jour calendaire dans le fuseau de référence
  const day = { $dateToString: { format: '%Y-%m-%d', date: '$answeredAt', timezone: env.timezone } };
  const and = [];
  if (from) and.push({ $expr: { $gte: [day, from] } });
  if (to) and.push({ $expr: { $lte: [day, to] } });
  if (and.length) filter.$and = and;

  const [total, answers] = await Promise.all([
    Answer.countDocuments(filter),
    Answer.find(filter)
      .sort({ answeredAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'firstName') // données personnelles limitées au strict nécessaire (pas d'email)
      .populate('question', 'question'),
  ]);
  return ok(res, {
    answers: answers.map((a) => ({
      id: a._id,
      user: a.user ? { id: a.user._id, firstName: a.user.firstName } : null,
      question: a.question ? { id: a.question._id, question: a.question.question } : null,
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
      answeredAt: a.answeredAt,
    })),
    pagination: paginationMeta(page, limit, total),
  });
});
