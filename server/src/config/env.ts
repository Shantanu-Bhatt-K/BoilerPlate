import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  AUTH_ENABLED: z.stringbool().default(false),
  PUBLIC_REGISTRATION_ENABLED: z.stringbool().default(false),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z
    .string()
    .regex(
      /^\d+(ms|s|m|h|d|w|y)$/,
      'JWT_EXPIRES_IN must be a valid duration like "15m", "1h", "7d"'
    )
    .default('15m'),
  REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
