import { z } from 'zod';
import { objectId, pageQuery } from './common.js';

export const createAnswerSchema = z
  .object({
    questionId: objectId,
    selectedAnswer: z.number().int().min(0).max(3),
  })
  .strict();

export const historyQuery = z.object(pageQuery).strict();
