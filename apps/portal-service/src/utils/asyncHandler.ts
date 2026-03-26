import { NextFunction, Request, Response } from "express";

export type AsyncRouteHandler<TRequest extends Request = Request, TResponse extends Response = Response> = (
  req: TRequest,
  res: TResponse,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler<TRequest extends Request = Request, TResponse extends Response = Response>(
  handler: AsyncRouteHandler<TRequest, TResponse>,
) {
  return (req: TRequest, res: TResponse, next: NextFunction): void => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}
