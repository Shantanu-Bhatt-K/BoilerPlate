import { env } from './env.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';
import { fatalError } from '../utils/fatal-error.js';

export async function initAuth() {
  if (!env.AUTH_ENABLED) {
    return;
  }

  if (!env.JWT_SECRET) {
    fatalError(
      'JWT_SECRET is not configured. Please set JWT_SECRET in your environment variables.'
    );
  }

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    fatalError(
      'ADMIN_EMAIL or ADMIN_PASSWORD is not configured. Please set both in your environment variables.'
    );
  }

  const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL });
  if (!existingAdmin) {
    const adminUser = new User({
      email: env.ADMIN_EMAIL,
      passwordHash: env.ADMIN_PASSWORD,
      role: 'admin',
    });
    await adminUser.save();
    logger.info(`Admin user created with email: ${env.ADMIN_EMAIL}`);
  } else {
    logger.info(`Admin user already exists with email: ${env.ADMIN_EMAIL}`);
  }
  logger.info('Authentication system initialized successfully.');
}
