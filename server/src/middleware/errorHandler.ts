import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
