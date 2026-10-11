import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (lettres, chiffres et tirets).')
  .max(80);

const imagePath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/') || v.startsWith('https://'), 'Image : chemin relatif ou URL https.');

const fields = {
  title: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(2000),
  coverImage: imagePath,
  author: z.string().trim().max(120),
  isPublished: z.boolean(),
};

export const createBookSchema = z
  .object({
    title: fields.title,
    slug: fields.slug.optional(),
    description: fields.description.default(''),
    coverImage: fields.coverImage.default(''),
    author: fields.author.default(''),
    isPublished: fields.isPublished.default(false),
  })
  .strict();

export const updateBookSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'Aucune modification fournie.');
