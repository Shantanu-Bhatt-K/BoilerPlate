import { env } from '../../config/env.js';
import * as local from './local.js';
import * as s3 from './s3.js';

const driver = env.STORAGE_DRIVER === 's3' ? s3 : local;

export const saveFile = driver.saveFile;
export const deleteFile = driver.deleteFile;
export const restoreFile = driver.restoreFile;
export const getFileUrl = driver.getFileUrl;