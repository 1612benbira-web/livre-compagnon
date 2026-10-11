import { env } from '../config/env.js';

export const notFound = (_req, res) =>
  res.status(404).json({ success: false, message: 'Ressource introuvable.', errors: [] });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  let errors = err.errors || [];

  if (err.code === 11000) {
    status = 409;
    message = err.keyPattern?.slug ? 'Ce slug est déjà utilisé par un autre livre.' : 'Cette ressource existe déjà.';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Données invalides.';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Identifiant invalide.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Requête trop volumineuse.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON invalide.';
  }

  if (status >= 500) {
    console.error(err); // pas de pile ni de secret renvoyés au client
    message = 'Une erreur est survenue.';
    errors = [];
  }
  res.status(status).json({ success: false, message, errors });
};
