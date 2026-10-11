import { z } from 'zod';
import { isValidDateKey } from '../utils/dates.js';
import { objectId, pageQuery } from './common.js';

const dateKey = z.string().refine(isValidDateKey, 'Date invalide (format AAAA-MM-JJ).');

export const adminUsersQuery = z
  .object({ ...pageQuery, search: z.string().trim().max(60).optional() })
  .strict();

export const adminAnswersQuery = z
  .object({
    ...pageQuery,
    user: objectId.optional(),
    question: objectId.optional(),
    from: dateKey.optional(),
    to: dateKey.optional(),
    result: z.enum(['correct', 'incorrect']).optional(),
  })
  .strict();
