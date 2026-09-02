import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/app-error.js';
import logger from '../utils/logger.js';

export function requireAuth() {
  if (!env.AUTH_ENABLED) {
    throw new Error('Authentication is not enabled. ');
  }
  return function (req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return next(new AppError(401, 'Missing or invalid Authorization header'));
    }

   const token = authHeader.slice('Bearer '.length);
    logger.warn(`Token received, length: ${token.length}`);

    try {
    req.user = verifyAccessToken(token);
    next();
    } catch (err) {
    logger.warn({ err }, 'Token verification failed');
    next(new AppError(401, 'Invalid or expired token'));
    }
  };
}
