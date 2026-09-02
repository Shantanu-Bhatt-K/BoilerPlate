import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} from '../validators/auth.validator.js';
import User from '../models/user.model.js';
import { issueTokens } from '../utils/issue-auth-tokens.js';
import { sendResponse } from '../utils/send-response.js';
import { hashToken } from '../utils/hashing.js';
import RefreshToken from '../models/refresh-token.model.js';
import { signAccessToken } from '../utils/jwt.js';

export async function register(req: Request, res: Response) {
  logger.debug('register called');
  if (!env.PUBLIC_REGISTRATION_ENABLED) {
    throw new AppError(403, 'Public registration is disabled');
  }
  const { email, password } = validateRegister(req.body);
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    const newUser = new User({ email, passwordHash: password });
    await newUser.save();
    logger.info(`New user registered: ${email}`);
    const { accessToken, refreshToken } = await issueTokens(newUser, req);
    sendResponse(res, 201, 'User created successfully', {
      accessToken,
      refreshToken,
    });
  } else {
    throw new AppError(409, 'User already exists');
  }
}

export async function login(req: Request, res: Response) {
  logger.debug('login called');
  const { email, password } = validateLogin(req.body);
  const user = await User.findOne({ email, deletedAt: null });
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Invalid email or password');
  }
  const { accessToken, refreshToken } = await issueTokens(user, req);

  sendResponse(res, 200, 'Login successful', { accessToken, refreshToken });
  logger.info(`User logged in: ${email}`);
}

export async function refresh(req: Request, res: Response) {
  logger.debug('refresh called');

  const { refreshToken } = validateRefreshToken(req.body);
  const tokenHash = hashToken(refreshToken);

  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc || tokenDoc.revokedAt || tokenDoc.expiresAt < new Date()) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findOne({ _id: tokenDoc.user, deletedAt: null });

  if (!user) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  tokenDoc.lastUsedAt = new Date();
  await tokenDoc.save();

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  logger.info(`Access token refreshed for user: ${user.email}`);
  sendResponse(res, 200, 'Token refreshed', { accessToken });
}

export async function logout(req: Request, res: Response) {
  logger.debug('logout called');

  const { refreshToken } = validateRefreshToken(req.body);
  const tokenHash = hashToken(refreshToken);

  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (tokenDoc && !tokenDoc.revokedAt) {
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
  }

  logger.info('Logout processed');
  sendResponse(res, 200, 'Logged out successfully');
}

export async function deleteAccount(req: Request, res: Response) {
  logger.debug('deleteAccount called');

  const user = await User.findOne({ _id: req.user!.userId, deletedAt: null });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  user.deletedAt = new Date();
  await user.save();

  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );

  logger.info(`Account deleted: ${user.email}`);
  sendResponse(res, 200, 'Account deleted');
}
