import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import logger from './logger.js';

const UPLOAD_DIR = path.resolve('uploads');
const DELETED_DIR = path.join(UPLOAD_DIR, 'deleted');

export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  logger.debug('saveFile called');

  const ext = path.extname(originalName);
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filePath, buffer);

  return filename;
}

export async function deleteFile(filename: string): Promise<void> {
  logger.debug('deleteFile called');

  await fs.mkdir(DELETED_DIR, { recursive: true });

  const sourcePath = path.join(UPLOAD_DIR, filename);
  const backupPath = path.join(DELETED_DIR, filename);

  await fs.rename(sourcePath, backupPath);
}

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

export async function restoreFile(filename: string): Promise<void> {
  logger.debug('restoreFile called');

  const backupPath = path.join(DELETED_DIR, filename);
  const restoredPath = path.join(UPLOAD_DIR, filename);

  await fs.rename(backupPath, restoredPath);
}
