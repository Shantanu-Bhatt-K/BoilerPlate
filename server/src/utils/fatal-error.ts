import logger from './logger.js';

export function fatalError(message: string, error?: unknown): never {
  if (error) {
    logger.error(error, message);
  } else {
    logger.error(message);
  }
  process.exit(1);
}
