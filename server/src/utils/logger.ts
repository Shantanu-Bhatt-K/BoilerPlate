import pino from 'pino';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pinoCaller = require('pino-caller');
import { env } from '../config/env.js';

const baseLogger = pino({
  level: env.NODE_ENV !== 'production' ? 'debug' : 'info',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
          },
        }
      : undefined,
});

const logger =
  env.NODE_ENV !== 'production' ? pinoCaller(baseLogger) : baseLogger;

export default logger;
