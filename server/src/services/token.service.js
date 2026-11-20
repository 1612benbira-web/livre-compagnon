import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'token';

export const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role, v: user.tokenVersion ?? 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite,
  path: '/',
});

// La durée du cookie suit exactement celle du jeton (JWT_EXPIRES_IN), sans valeur codée en dur
export const setAuthCookie = (res, token) => {
  const { exp } = jwt.decode(token);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: Math.max(0, exp * 1000 - Date.now()) });
};

export const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

// Un jeton émis avant le dernier changement de mot de passe n'est plus valable
// (les jetons antérieurs à cette fonctionnalité n'ont pas de "v" : ils valent la version 0)
export const isRevoked = (payload, user) => (payload.v ?? 0) !== (user.tokenVersion ?? 0);
