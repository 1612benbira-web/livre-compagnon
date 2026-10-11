import { Router } from 'express';
import { getDashboard, listAnswers, listUsers } from '../controllers/admin.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { adminAnswersQuery, adminUsersQuery } from '../validators/admin.validators.js';

const router = Router();
router.use(requireAuth, requireAdmin); // rôle vérifié côté backend pour toutes les routes admin
router.get('/dashboard', getDashboard);
router.get('/users', validate(adminUsersQuery, 'query'), listUsers);
router.get('/answers', validate(adminAnswersQuery, 'query'), listAnswers);
export default router;
