import z from 'zod';
import { validate } from '../utils/validate.js';

const filenameSchema = z.object({
  filename: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i,
      { error: 'Invalid filename' }
    ),
});

export function validateFilename(data: unknown) {
  return validate(filenameSchema, data);
}
