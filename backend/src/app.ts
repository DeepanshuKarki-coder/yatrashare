import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { generalLimiter } from './middlewares/rateLimiter';
import { db } from './models/db';
import { env } from './config/env';
import { NotFoundError } from './utils/errors';

export function createApp() {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for API or customized for client
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.vercel.app') ||
          origin === env.CLIENT_URL
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request logging
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Body parsers
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // General rate limiter
  app.use('/api', generalLimiter);

  // Root welcome endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'YatraShare API',
      version: '1.0.0',
      status: 'online',
      documentation: 'https://github.com/DeepanshuKarki-coder/yatrashare',
      endpoints: {
        health: '/health',
        ready: '/health/ready',
        api: '/api',
      },
    });
  });

  // Health and Observability endpoints
  app.get('/health', async (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health/live', (req: Request, res: Response) => {
    res.status(200).json({ status: 'live' });
  });

  app.get('/health/ready', async (req: Request, res: Response) => {
    try {
      await db.queryOne('SELECT 1');
      res.status(200).json({ status: 'ready', database: 'connected' });
    } catch (err) {
      res.status(503).json({ status: 'unavailable', database: 'disconnected' });
    }
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // 404 Handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.url} not found`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
