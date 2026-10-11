import { Router } from 'express';
import { createBook, deleteBook, getBook, listBooks, updateBook } from '../controllers/book.controller.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookSchema, updateBookSchema } from '../validators/book.validators.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();
router.get('/', optionalAuth, listBooks);
router.get('/:id', optionalAuth, getBook); // id ou slug
router.post('/', requireAuth, requireAdmin, validate(createBookSchema), createBook);
router.put('/:id', requireAuth, requireAdmin, validate(idParamSchema, 'params'), validate(updateBookSchema), updateBook);
router.delete('/:id', requireAuth, requireAdmin, validate(idParamSchema, 'params'), deleteBook);
export default router;
