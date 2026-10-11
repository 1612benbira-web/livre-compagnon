import { z } from 'zod';
import { isValidDateKey, dateKeyToUTCDate } from '../utils/dates.js';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identifiant invalide.');

export const idParamSchema = z.object({ id: objectId });

export const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

// "YYYY-MM-DD" → Date (minuit UTC du jour calendaire)
export const dateOnly = z
  .string()
  .refine(isValidDateKey, 'Date invalide (format AAAA-MM-JJ).')
  .transform(dateKeyToUTCDate);
