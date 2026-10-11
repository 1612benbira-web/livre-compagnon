import { Router } from 'express';
import {
  createQuestion, deleteQuestion, getQuestion, getTodayQuestion, listQuestions, updateQuestion,
} from '../controllers/question.controller.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/common.js';
import {
  createQuestionSchema, getQuestionQuery, listQuestionsQuery, todayQuery, updateQuestionSchema,
} from '../validators/question.validators.js';

const router = Router();
router.get('/', optionalAuth, validate(listQuestionsQuery, 'query'), listQuestions);
router.get('/today', optionalAuth, validate(todayQuery, 'query'), getTodayQuestion); // avant /:id
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), validate(getQuestionQuery, 'query'), getQuestion);
router.post('/', requireAuth, requireAdmin, validate(createQuestionSchema), createQuestion);
router.put('/:id', requireAuth, requireAdmin, validate(idParamSchema, 'params'), validate(updateQuestionSchema), updateQuestion);
router.delete('/:id', requireAuth, requireAdmin, validate(idParamSchema, 'params'), deleteQuestion);
export default router;
