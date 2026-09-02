import bcyrpt from 'bcrypt';
import logger from './logger.js';
import { SALT_ROUNDS } from '../config/constants.js';

import crypto from 'crypto';

export async function hashPassword(plainPassword: string): Promise<string> {
  logger.debug('hashPassword called');
  return bcyrpt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  logger.debug('comparePassword called');
  return bcyrpt.compare(plainPassword, hashedPassword);
}

export function generateRawToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
