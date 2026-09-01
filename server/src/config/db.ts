import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error(err, 'MongoDB connection error');
    process.exit(1);
  }
}
