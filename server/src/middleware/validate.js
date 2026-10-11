import { ApiError } from '../utils/ApiError.js';

// Valide req[source] avec un schéma zod.
// Express 5 : req.query est en lecture seule, donc le résultat est toujours disponible
// dans req.validated[source] (et req.body est remplacé pour le corps).
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(400, 'Données invalides.', errors));
  }
  req.validated = { ...(req.validated || {}), [source]: result.data };
  if (source === 'body') req.body = result.data;
  next();
};
