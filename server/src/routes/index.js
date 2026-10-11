import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import bookRoutes from './book.routes.js';
import questionRoutes from './question.routes.js';
import answerRoutes from './answer.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const db = states[mongoose.connection.readyState] ?? 'unknown';
  res.status(db === 'connected' ? 200 : 503).json({
    success: db === 'connected',
    data: { status: db === 'connected' ? 'ok' : 'degraded', db },
    message: 'État du service',
  });
});

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/questions', questionRoutes);
router.use('/answers', answerRoutes);
router.use('/admin', adminRoutes);

export default router;
