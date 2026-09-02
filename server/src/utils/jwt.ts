import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import logger from './logger.js';
import { AccessTokenPayload } from '../types/auth.types.js';
function getJwtSecret(): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return env.JWT_SECRET;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  logger.debug('signAccessToken called');

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  logger.debug('verifyAccessToken called');

  return jwt.verify(token, getJwtSecret()) as AccessTokenPayload;
}
