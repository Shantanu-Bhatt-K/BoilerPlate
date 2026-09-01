import { Request, Response } from 'express';
import logger from '../utils/logger.js';
export function getHealth(req: Request, res: Response) {
  logger.debug('getHealth called');
  res.json({ status: 'ok' });
}
