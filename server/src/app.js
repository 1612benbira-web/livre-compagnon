import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { originCheck } from './middleware/originCheck.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.disable('x-powered-by');
if (env.isProd) app.set('trust proxy', 1); // derrière le proxy de l'hébergeur (IP réelle pour le rate limiting)
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
if (env.nodeEnv !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', originCheck, routes);
app.use(notFound);
app.use(errorHandler);

export default app;
