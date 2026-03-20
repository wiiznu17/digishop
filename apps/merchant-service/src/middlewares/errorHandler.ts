import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

interface ValidationDetail {
  path: string;
  message: string;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    const details: ValidationDetail[] = err.issues.map((issue) => ({
      path: issue.path.length ? issue.path.join(".") : "request",
      message: issue.message,
    }));

    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      details,
    });
  }

  if (err instanceof AppError) {
    const payload: Record<string, unknown> = {
      status: "error",
      message: err.message,
    };

    if (typeof err.details !== "undefined") {
      payload.details = err.details;
    }

    return res.status(err.statusCode).json(payload);
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[errorHandler] Unhandled error:", err);
  }

  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
