import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

// Protection CSRF complémentaire à SameSite : une requête qui modifie des données
// et qui porte un en-tête Origin doit venir du frontend autorisé.
export const originCheck = (req, _res, next) => {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== env.clientUrl) return next(new ApiError(403, 'Origine non autorisée.'));
  next();
};
