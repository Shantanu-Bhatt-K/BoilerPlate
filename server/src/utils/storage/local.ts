import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import logger from '../logger.js';
import { AppError } from '../app-error.js';
import { extension as mimeExtension } from 'mime-types';


const UPLOAD_DIR = path.resolve('uploads');
const DELETED_DIR = path.join(UPLOAD_DIR, 'deleted');

function assertInside(dir: string, filename: string) {
  const resolved = path.resolve(dir, filename);
  if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
    throw new AppError(400, 'Invalid filename');
  }
}

function resolveInside(dir: string, filename: string): string {
  assertInside(dir, filename);
  return path.resolve(dir, filename);
}

export async function saveFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  logger.debug('saveFile called');

  const ext = mimeExtension(mimeType) || 'bin';
  const filename = `${randomUUID()}${ext}`;
  const filePath = resolveInside(UPLOAD_DIR, filename);

  await fs.writeFile(filePath, buffer);

  return filename;
}

export async function deleteFile(filename: string): Promise<void> {
  logger.debug('deleteFile called');

  await fs.mkdir(DELETED_DIR, { recursive: true });

  const sourcePath = resolveInside(UPLOAD_DIR, filename);
  const backupPath = resolveInside(DELETED_DIR, filename);

  await fs.rename(sourcePath, backupPath);
}

export async function getFileUrl(filename: string): Promise<string> {
  assertInside(UPLOAD_DIR, filename);
  return `/api/files/${filename}`;
}
export async function restoreFile(filename: string): Promise<void> {
  logger.debug('restoreFile called');

  const backupPath = resolveInside(DELETED_DIR, filename);
  const restoredPath = resolveInside(UPLOAD_DIR, filename);

  await fs.rename(backupPath, restoredPath);
}

export async function readFile(filename: string): Promise<Buffer> {
  logger.debug('readFile (local) called');

  const filePath = resolveInside(UPLOAD_DIR, filename);
  return fs.readFile(filePath);
}
