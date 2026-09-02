import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import { sendResponse } from '../utils/send-response.js';
import logger from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const context = {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  if (err instanceof AppError) {
    logger.warn({ ...context, statusCode: err.statusCode }, err.message);
    return sendResponse(res, err.statusCode, err.message);
  }

  logger.error({ ...context, err }, 'Unexpected error');
  sendResponse(res, 500, 'Internal server error');
}
