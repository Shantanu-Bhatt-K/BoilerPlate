import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';
import logger from '../utils/logger.js';

let s3Client: S3Client | null = null;

export function initS3() {
    if(env.STORAGE_DRIVER !== 's3') { 
        return;
    }

    if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET) {
        logger.error('STORAGE_DRIVER is set to "s3" but required credentials are missing in .env');
        process.exit(1);
    }

    s3Client = new S3Client({
        region: env.S3_REGION || 'auto',
        endpoint: env.S3_ENDPOINT,
        credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
    });
    logger.info('S3 client configured');  
}

export function getS3Client(): S3Client {
    if (!s3Client) {
        throw new Error('S3 client not initialized. Call initS3() first.');
    }
    return s3Client;
}