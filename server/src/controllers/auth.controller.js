import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Answer } from '../models/Answer.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/response.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../services/token.service.js';
import { resetPasswordEmail, sendEmail } from '../services/mail.service.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;
// Hash factice : même coût de calcul si l'email est inconnu (limite l'énumération par le temps)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-1', BCRYPT_ROUNDS);

export const register = asyncHandler(async (req, res) => {
  const { firstName, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'Cette adresse email est déjà utilisée.');
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // Le rôle n'est jamais lu depuis la requête : toujours "user" à l'inscription
  const user = await User.create({ firstName, email, passwordHash, role: 'user' });
  setAuthCookie(res, signToken(user));
  return created(res, { user }, 'Compte créé avec succès.');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, 'Email ou mot de passe incorrect.');
  setAuthCookie(res, signToken(user));
  return ok(res, { user }, 'Connexion réussie.');
});

export const logout = (_req, res) => {
  clearAuthCookie(res);
  return ok(res, null, 'Déconnexion réussie.');
};

export const me = (req, res) => ok(res, { user: req.user });

export const updateProfile = asyncHandler(async (req, res) => {
  // Seul le prénom est modifiable : ni rôle, ni email
  req.user.firstName = req.body.firstName;
  await req.user.save();
  return ok(res, { user: req.user }, 'Profil mis à jour.');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError(401, 'Mot de passe actuel incorrect.');
  }
  if (currentPassword === newPassword) throw new ApiError(400, 'Le nouveau mot de passe doit être différent.');
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // déconnecte les autres appareils
  await user.save();
  setAuthCookie(res, signToken(user)); // la session en cours reste ouverte
  return ok(res, null, 'Mot de passe modifié.');
});

// Suppression du compte : le compte et toutes ses réponses sont supprimés (pas de conservation)
export const deleteAccount = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') throw new ApiError(403, 'Un compte administrateur ne peut pas être supprimé ici.');
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new ApiError(401, 'Mot de passe incorrect.');
  }
  await Answer.deleteMany({ user: user._id });
  await user.deleteOne();
  clearAuthCookie(res);
  return ok(res, null, 'Compte supprimé.');
});

// --- Mot de passe oublié ---

const RESET_MINUTES = 30;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const FORGOT_MESSAGE = 'Si un compte existe avec cette adresse, un email vient de t’être envoyé.';

// Réponse identique que le compte existe ou non (pas d'énumération des emails).
// L'email est envoyé sans attendre la réponse de Resend : le temps de réponse ne trahit rien non plus.
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hashToken(token);
    user.resetTokenExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
    await user.save();
    const url = `${env.clientUrl.replace(/\/+$/, '')}/reinitialiser-mot-de-passe?token=${token}`;
    const mail = resetPasswordEmail({ firstName: user.firstName, url, minutes: RESET_MINUTES });
    const sending = sendEmail({ to: user.email, ...mail }).catch((err) =>
      console.error('Email de réinitialisation non envoyé :', err.message)
    );
    if (env.nodeEnv === 'test') await sending;
  }
  return ok(res, null, FORGOT_MESSAGE);
});

// Jeton à usage unique, valable 30 minutes ; toutes les sessions existantes sont fermées
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExpires');
  if (!user) throw new ApiError(400, 'Ce lien est invalide ou a expiré. Fais une nouvelle demande.');

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // ferme toutes les sessions
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  clearAuthCookie(res);
  return ok(res, null, 'Mot de passe modifié. Tu peux maintenant te connecter.');
});
