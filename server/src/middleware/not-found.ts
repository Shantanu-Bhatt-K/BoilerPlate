import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { sendResponse } from '../utils/send-response.js';

export function notFound(req: Request, res: Response) {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  sendResponse(res, 404, 'Route not found');
}
