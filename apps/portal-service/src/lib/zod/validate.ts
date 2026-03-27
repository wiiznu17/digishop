import { ZodSchema, ZodError } from 'zod'
import { Request, Response, NextFunction } from 'express'

export function zodValidate<
  TSchema extends ZodSchema<any>,
  TPart extends 'body' | 'params' | 'query' = 'body'
>(schema: TSchema, part: TPart = 'body' as TPart) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse((req as any)[part])
      ;(req as any)[part] = parsed // ใช้ค่าที่ parse แล้ว (trim/coerce)
      next()
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: e.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      next(e)
    }
  }
}
