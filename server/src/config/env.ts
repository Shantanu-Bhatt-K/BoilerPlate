import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});
export const env = envSchema.parse(process.env);
