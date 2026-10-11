import { Router } from 'express';
import { createAnswer, getAnswer, getHistory, getProgress } from '../controllers/answer.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAnswerSchema, historyQuery } from '../validators/answer.validators.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();
router.use(requireAuth);
router.post('/', validate(createAnswerSchema), createAnswer);
router.get('/history', validate(historyQuery, 'query'), getHistory); // avant /:id
router.get('/progress', getProgress);
router.get('/:id', validate(idParamSchema, 'params'), getAnswer);
export default router;
