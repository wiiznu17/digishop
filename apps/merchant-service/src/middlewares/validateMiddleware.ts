import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

type RequestSchema = z.ZodType<{
  body?: unknown
  query?: unknown
  params?: unknown
}>

export function validateRequest(schema: RequestSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    })

    if (parsed.body !== undefined) {
      req.body = parsed.body
    }

    if (parsed.query !== undefined) {
      req.query = parsed.query as Request['query']
    }

    if (parsed.params !== undefined) {
      req.params = parsed.params as Request['params']
    }

    next()
  }
}
