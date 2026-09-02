import { Request } from 'express';
import { IUser } from '../models/user.model.js';
import { signAccessToken } from './jwt.js';
import { generateRawToken, hashToken } from './hashing.js';
import { env } from '../config/env.js';
import RefreshToken from '../models/refresh-token.model.js';
import logger from './logger.js';

export async function issueTokens(user: IUser, req: Request) {
  logger.debug('issueTokens called');

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  const rawRefreshToken = generateRawToken();

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ),
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  return { accessToken, refreshToken: rawRefreshToken };
}
