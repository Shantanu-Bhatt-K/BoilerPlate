import { Request, Response } from 'express';
import logger from '../utils/logger.js';

export function notFound(req: Request, res: Response) {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
}
