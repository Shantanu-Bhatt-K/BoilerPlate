import mongoose from 'mongoose';
import { env } from './env.js';
import { fatalError } from '../utils/fatal-error.js';
import logger from '../utils/logger.js';

mongoose.set('sanitizeFilter', true);

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    fatalError('MongoDB connection error', err);
  }
}
