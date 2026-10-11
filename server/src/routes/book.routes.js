import express, { Router } from 'express';
import { createBook, deleteBook, deleteCover, getBook, getBookQr, getCover, uploadCover, listBooks, updateBook } from '../controllers/book.controller.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookSchema, qrQuery, updateBookSchema } from '../validators/book.validators.js';
import { idParamSchema } from '../validators/common.js';

const router = Router();
router.get('/', optionalAuth, listBooks);
router.get('/:id', optionalAuth, getBook); // id ou slug
router.get('/:id/qr', requireAuth, requireAdmin, validate(idParamSchema, 'params'), validate(qrQuery, 'query'), getBookQr);
router.get('/:id/cover', optionalAuth, validate(idParamSchema, 'params'), getCover);
// Corps brut (octets de l'image), 2 Mo maximum ; le vrai format est vérifié dans le contrôleur
router.put(
  '/:id/cover',
  requireAuth, requireAdmin, validate(idParamSchema, 'params'),
  express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '2mb' }),
  uploadCover
);
router.delete('/:id/cover', requireAuth, requireAdmin, validate(idParamSchema, 'params'), deleteCover);
router.post('/', requireAuth, requireAdmin, validate(createBookSchema), createBook);
router.put('/:id', requireAuth, requireAdmin, validate(idParamSchema, 'params'), validate(updateBookSchema), updateBook);
router.delete('/:id', requireAuth, requireAdmin, validate(idParamSchema, 'params'), deleteBook);
export default router;
