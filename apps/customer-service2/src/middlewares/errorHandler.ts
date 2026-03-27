import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  console.error('[Unhandled Error]', err)
  return res.status(500).json({ error: 'Internal server error' })
}
