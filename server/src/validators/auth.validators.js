import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(72, 'Le mot de passe est trop long.') // limite bcrypt
  .regex(/[A-Za-z]/, 'Le mot de passe doit contenir une lettre.')
  .regex(/\d/, 'Le mot de passe doit contenir un chiffre.');

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Prénom trop court.').max(50, 'Prénom trop long.'),
    email: z.string().trim().toLowerCase().email('Adresse email invalide.').max(254),
    password,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(72),
  })
  .strict();

export const updateProfileSchema = z
  .object({ firstName: z.string().trim().min(2, 'Prénom trop court.').max(50, 'Prénom trop long.') })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export const deleteAccountSchema = z.object({ password: z.string().min(1).max(72) }).strict();
