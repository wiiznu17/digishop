// Generic validator middleware with Zod
import type { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";

type PartSchemas = {
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
  body?: ZodSchema<any>;
};

export function validate(parts: PartSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result: any = {};
      if (parts.params) result.params = await parts.params.parseAsync(req.params);
      if (parts.query)  result.query  = await parts.query.parseAsync(req.query);
      if (parts.body)   result.body   = await parts.body.parseAsync(req.body);
      // เก็บค่าที่ validate แล้วไว้ให้ controller ใช้ได้ หากต้องการ
      (req as any).validated = result;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          details: err.errors.map(e => ({
            path: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        });
      }
      return next(err);
    }
  };
}
