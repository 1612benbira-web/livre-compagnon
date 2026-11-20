import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { COOKIE_NAME, isRevoked, verifyToken } from '../services/token.service.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new ApiError(401, 'Authentification requise.');
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Session invalide ou expirée.');
  }
  // Le rôle vient toujours de la base, jamais uniquement du jeton
  const user = await User.findById(payload.sub);
  if (!user || isRevoked(payload, user)) throw new ApiError(401, 'Session invalide ou expirée.');
  req.user = user;
  next();
});

export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new ApiError(403, 'Accès interdit.'));
  next();
};

// Authentification facultative : renseigne req.user si le cookie est valide, sinon continue en visiteur
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user && !isRevoked(payload, user)) req.user = user;
  } catch {
    // jeton invalide : on traite la requête comme celle d'un visiteur
  }
  next();
});
