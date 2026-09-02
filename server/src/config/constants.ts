export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

export const BODY_SIZE_LIMIT = '10mb';
export const MAX_FILES_PER_UPLOAD = 10;
export const PRESIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour
export const SALT_ROUNDS = 10;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const AUTH_RATE_LIMIT_MAX_REQUESTS = 5;
export const SHUTDOWN_TIMEOUT_MS = 10000;
