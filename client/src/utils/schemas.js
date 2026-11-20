import { z } from 'zod';

// Mêmes règles que le serveur ; le serveur reste l'autorité
export const passwordRule = z
  .string()
  .min(8, 'Au moins 8 caractères.')
  .max(72, 'Mot de passe trop long.')
  .regex(/[A-Za-z]/, 'Ajoute au moins une lettre.')
  .regex(/\d/, 'Ajoute au moins un chiffre.');

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Ton email est nécessaire.').email('Adresse email invalide.'),
  password: z.string().min(1, 'Ton mot de passe est nécessaire.'),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Au moins 2 caractères.').max(50, 'Prénom trop long.'),
    email: z.string().trim().min(1, 'Ton email est nécessaire.').email('Adresse email invalide.'),
    password: passwordRule,
    confirmPassword: z.string().min(1, 'Confirme ton mot de passe.'),
    acceptTerms: z.boolean().refine((v) => v === true, 'Tu dois accepter pour créer un compte.'),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Les mots de passe ne correspondent pas.', path: ['confirmPassword'] });

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Au moins 2 caractères.').max(50, 'Prénom trop long.'),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Entre ton mot de passe actuel.'),
    newPassword: passwordRule,
    confirmPassword: z.string().min(1, 'Confirme le nouveau mot de passe.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Les mots de passe ne correspondent pas.', path: ['confirmPassword'] });

export const questionFormSchema = z.object({
  book: z.string().min(1, 'Choisis un livre.'),
  question: z.string().trim().min(5, 'Au moins 5 caractères.').max(300, '300 caractères maximum.'),
  answers: z.array(z.string().trim().min(1, 'Proposition obligatoire.').max(150, '150 caractères maximum.')).length(4),
  correctAnswer: z.coerce.number().int().min(0).max(3),
  explanation: z.string().trim().max(600, '600 caractères maximum.'),
  status: z.enum(['draft', 'published', 'archived']),
  publicationDate: z.string(),
});

export const bookFormSchema = z.object({
  title: z.string().trim().min(2, 'Au moins 2 caractères.').max(120, '120 caractères maximum.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Le slug est obligatoire.')
    .max(80, '80 caractères maximum.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Minuscules, chiffres et tirets uniquement (pas d’espace ni d’accent).'),
  description: z.string().trim().max(2000, '2000 caractères maximum.'),
  author: z.string().trim().max(120, '120 caractères maximum.'),
  coverImage: z
    .string()
    .trim()
    .max(500, '500 caractères maximum.')
    .refine((v) => v === '' || v.startsWith('/') || v.startsWith('https://'), 'Un chemin commençant par / ou une URL https.'),
  isPublished: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Ton email est nécessaire.').email('Adresse email invalide.'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string().min(1, 'Confirme ton nouveau mot de passe.'),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Les mots de passe ne correspondent pas.', path: ['confirmPassword'] });
