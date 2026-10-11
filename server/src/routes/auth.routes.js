import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { changePassword, deleteAccount, login, logout, me, register, updateProfile } from '../controllers/auth.controller.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema, deleteAccountSchema, loginSchema, registerSchema, updateProfileSchema,
} from '../validators/auth.validators.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.authRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives, réessaie plus tard.', errors: [] },
});

const router = Router();
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
router.put('/password', requireAuth, authLimiter, validate(changePasswordSchema), changePassword);
router.delete('/account', requireAuth, authLimiter, validate(deleteAccountSchema), deleteAccount);
export default router;
