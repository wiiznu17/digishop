import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('[AuthService] Error Details:', err)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
}
