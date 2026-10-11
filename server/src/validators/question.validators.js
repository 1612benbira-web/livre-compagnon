import { z } from 'zod';
import { dateOnly, objectId, pageQuery } from './common.js';

const statusEnum = z.enum(['draft', 'published', 'archived']);

const fields = {
  book: objectId,
  question: z.string().trim().min(5, 'Question trop courte.').max(300),
  answers: z.array(z.string().trim().min(1).max(150)).length(4, 'Il faut exactement 4 propositions.'),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().trim().max(600),
  status: statusEnum,
  publicationDate: dateOnly.nullable(),
};

export const createQuestionSchema = z
  .object({
    book: fields.book,
    question: fields.question,
    answers: fields.answers,
    correctAnswer: fields.correctAnswer,
    explanation: fields.explanation.default(''),
    status: fields.status.default('draft'),
    publicationDate: fields.publicationDate.optional(),
  })
  .strict();

export const updateQuestionSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'Aucune modification fournie.');

export const listQuestionsQuery = z
  .object({ ...pageQuery, status: statusEnum.optional(), book: objectId.optional() })
  .strict();

export const todayQuery = z.object({ book: z.string().trim().max(80).optional() }).strict();
