import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refresh,
  logout,
  deleteAccount,
} from '../controllers/auth.controller.js';

import {
  AUTH_RATE_LIMIT_WINDOW_MS,
  AUTH_RATE_LIMIT_MAX_REQUESTS,
} from '../config/constants.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: { message: 'Too many attempts, please try again later', data: null },
  skipSuccessfulRequests: true,
});

router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', logout);
router.delete('/auth/delete/me', requireAuth(), deleteAccount);

export default router;
