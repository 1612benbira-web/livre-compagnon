import bcrypt from 'bcryptjs';
import { Answer } from '../models/Answer.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/response.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../services/token.service.js';

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
  await user.save();
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
