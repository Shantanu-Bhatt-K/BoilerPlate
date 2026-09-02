import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { IncomingMessage, ServerResponse } from 'http';
import { createRequire } from 'module';
import { initS3 } from './config/s3.js';

const require = createRequire(import.meta.url);
const pinoHttp = require('pino-http');

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import logger from './utils/logger.js';
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  BODY_SIZE_LIMIT,
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

connectDB().then(() => {
  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
});
