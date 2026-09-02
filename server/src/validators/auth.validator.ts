import { z } from 'zod';
import { validate } from '../utils/validate.js';

const registerSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' }),
});

const loginSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1, { error: 'Password is required' }),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { error: 'Refresh token is required' }),
});

export function validateRegister(data: unknown) {
  return validate(registerSchema, data);
}

export function validateLogin(data: unknown) {
  return validate(loginSchema, data);
}

export function validateRefreshToken(data: unknown) {
  return validate(refreshTokenSchema, data);
}
