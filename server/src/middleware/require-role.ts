import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export function requireRole(...allowedRoles: string[]) {
  if (!env.AUTH_ENABLED) {
    throw new Error(
      'requireRole() is used on a route but AUTH_ENABLED is false in .env'
    );
  }

  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}
