import { Request, Response } from 'express';
import * as storage from '../utils/storage/index.js';
import logger from '../utils/logger.js';

export async function uploadFiles(req: Request, res: Response) {
  logger.debug('uploadFiles called');

  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    logger.warn('uploadFiles: no files provided in request');
    return res.status(400).json({ error: 'No files provided' });
  }

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const filename = await storage.saveFile(file.buffer, file.originalname);
      return { filename, url:  await storage.getFileUrl(filename) };
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

  res.status(201).json({ uploaded, failedCount: failed });
}

export async function uploadFile(req: Request, res: Response) {
  logger.debug('uploadFile called');

  if (!req.file) {
    logger.warn('uploadFile: no file provided in request');
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const filename = await storage.saveFile(
      req.file.buffer,
      req.file.originalname
    );
    const url = await storage.getFileUrl(filename);

    logger.info(`File uploaded: ${filename}`);
    res.status(201).json({ filename, url });
  } catch (err) {
    logger.error(err, 'Failed to save file');
    res.status(500).json({ error: 'Failed to save file' });
  }
}

export async function deleteFile(
  req: Request<{ filename: string }>,
  res: Response
) {
  logger.debug('deleteFile called');

  const { filename } = req.params;

  try {
    await storage.deleteFile(filename);

    logger.info(`File deleted: ${filename}`);
    res.json({ message: 'File deleted' });
  } catch (err) {
    logger.error(err, 'Failed to delete file');
    res.status(404).json({ error: 'File not found' });
  }
}

export async function restoreFile(
  req: Request<{ filename: string }>,
  res: Response
) {
  logger.debug('restoreFile called');

  const { filename } = req.params;

  try {
    await storage.restoreFile(filename);
    logger.info(`File restored: ${filename}`);
    res.json({ message: 'File restored' });
  } catch (err) {
    logger.error(err, 'Failed to restore file');
    res.status(404).json({ error: 'File not found in backup' });
  }
}
