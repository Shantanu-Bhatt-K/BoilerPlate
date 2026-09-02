import { Response } from 'express';

export function sendResponse(
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null
) {
  res.status(statusCode).json({ message, data });
}
