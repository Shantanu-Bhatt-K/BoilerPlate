import {
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { getS3Client } from '../../config/s3.js';
import { env } from '../../config/env.js';
import logger from '../logger.js';
import { PRESIGNED_URL_EXPIRY_SECONDS } from '../../config/constants.js';
import { AppError } from '../app-error.js';
import { extension as mimeExtension } from 'mime-types';

function assertSafeKey(key: string): void {
  if (key.includes('/') || key.includes('\\') || key.includes('..')) {
    throw new AppError(400, 'Invalid filename');
  }
}

export async function saveFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  logger.debug('saveFile (s3) called');

  const ext = mimeExtension(mimeType) || 'bin';
  const key = `${randomUUID()}.${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
    })
  );

  return key;
}

export async function deleteFile(key: string): Promise<void> {
  logger.debug('deleteFile (s3) called');
  assertSafeKey(key);
  const client = getS3Client();
  const deletedKey = `deleted/${key}`;

  await client.send(
    new CopyObjectCommand({
      Bucket: env.S3_BUCKET,
      CopySource: `${env.S3_BUCKET}/${key}`,
      Key: deletedKey,
    })
  );

  await client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    })
  );
}

export async function restoreFile(key: string): Promise<void> {
  logger.debug('restoreFile (s3) called');
  assertSafeKey(key);
  const client = getS3Client();
  const deletedKey = `deleted/${key}`;

  await client.send(
    new CopyObjectCommand({
      Bucket: env.S3_BUCKET,
      CopySource: `${env.S3_BUCKET}/${deletedKey}`,
      Key: key,
    })
  );

  await client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: deletedKey,
    })
  );
}

export async function getFileUrl(key: string): Promise<string> {
  logger.debug('getFileUrl (s3) called');
  assertSafeKey(key);
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });
}

export async function readFile(key: string): Promise<Buffer> {
  logger.debug('readFile (s3) called');
  assertSafeKey(key);
  throw new AppError(500, 'readFile is not supported by the s3 driver');
}
