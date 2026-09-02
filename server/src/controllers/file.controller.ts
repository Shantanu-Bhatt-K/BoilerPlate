import { Request, Response } from 'express';
import * as storage from '../utils/storage/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/app-error.js';
import { sendResponse } from '../utils/send-response.js';
import { validateFilename } from '../validators/file.validator.js';
import { lookup as lookupMimeType } from 'mime-types';
import { env } from '../config/env.js';

export async function uploadFiles(req: Request, res: Response) {
  logger.debug('uploadFiles called');

  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    throw new AppError(400, 'No files provided');
  }

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const filename = await storage.saveFile(file.buffer, file.mimetype);
      return { filename, url: await storage.getFileUrl(filename) };
    })
  );

  const uploaded = results
    .filter((r) => r.status === 'fulfilled')
    .map(
      (r) =>
        (r as PromiseFulfilledResult<{ filename: string; url: string }>).value
    );

  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    logger.warn(`Batch upload: ${uploaded.length} succeeded, ${failed} failed`);
  } else {
    logger.info(`Batch upload: ${uploaded.length} files uploaded`);
  }

  sendResponse(res, 201, 'Files processed', { uploaded, failedCount: failed });
}

export async function uploadFile(req: Request, res: Response) {
  logger.debug('uploadFile called');

  if (!req.file) {
    throw new AppError(400, 'No file provided');
  }

  const filename = await storage.saveFile(
    req.file.buffer,
    req.file.mimetype
  );
  const url = await storage.getFileUrl(filename);

  logger.info(`File uploaded: ${filename}`);
  sendResponse(res, 201, 'File uploaded successfully', { filename, url });
}

export async function deleteFile(
  req: Request<{ filename: string }>,
  res: Response
) {
  logger.debug('deleteFile called');

  const { filename } = validateFilename(req.params);

  await storage.deleteFile(filename);

  logger.info(`File deleted: ${filename}`);
  sendResponse(res, 200, 'File deleted');
}

export async function restoreFile(
  req: Request<{ filename: string }>,
  res: Response
) {
  logger.debug('restoreFile called');

  const { filename } = validateFilename(req.params);

  await storage.restoreFile(filename);

  logger.info(`File restored: ${filename}`);
  sendResponse(res, 200, 'File restored');
}

export async function getFile(
  req: Request<{ filename: string }>,
  res: Response
) {
  logger.debug('getFile called');

  if (env.STORAGE_DRIVER !== 'local') {
    throw new AppError(404, 'Not found');
  }

  const { filename } = validateFilename(req.params);

  const buffer = await storage.readFile(filename);
  const contentType = lookupMimeType(filename) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', 'attachment');
  res.send(buffer);
}
