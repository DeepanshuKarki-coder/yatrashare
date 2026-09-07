import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { initializeSockets } from './sockets';
import { backgroundWorker } from './services/jobs/worker';
import { db } from './models/db';
import { env } from './config/env';
import { logger } from './config/logger';

async function bootstrap() {
  // Initialize Database and run migrations
  await db.init();

  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    },
  });

  initializeSockets(io);
  backgroundWorker.start();

  const PORT = env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`🚀 YatraShare Backend running on http://localhost:${PORT}`);
    logger.info(`Environment: ${env.NODE_ENV} | Payment Default: ${env.PAYMENT_GATEWAY_DEFAULT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down server...`);
    backgroundWorker.stop();
    server.close(async () => {
      await db.close();
      logger.info('Server closed, database connection pool drained.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', err);
  process.exit(1);
});
