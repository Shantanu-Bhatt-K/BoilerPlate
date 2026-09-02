import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { IncomingMessage, ServerResponse } from 'http';
import { createRequire } from 'module';


const require = createRequire(import.meta.url);
const pinoHttp = require('pino-http');

import { initS3 } from './config/s3.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initAuth } from './config/auth.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import logger from './utils/logger.js';
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  BODY_SIZE_LIMIT,
  SHUTDOWN_TIMEOUT_MS
} from './config/constants.js';
const app = express();

app.use(helmet());
app.use(cors());
app.use(
  rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX_REQUESTS })
);
app.use(express.json({ limit: BODY_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req: IncomingMessage) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res: ServerResponse) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

initS3();

connectDB().then(async () => {
  await initAuth();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  async function gracefulShutdown(signal: string) {
    logger.info(`Received ${signal}. Closing server...`);
    server.close(async () => {
      logger.info('HTTP server closed');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    },SHUTDOWN_TIMEOUT_MS);
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
});
