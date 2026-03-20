import { NextFunction, Request, Response } from "express";
import { CarrierContext } from "../types/express";
import { carrierService } from "../services/carrierService";
import { asyncHandler } from "../utils/asyncHandler";

export const carrierWebhook: (req: Request, res: Response, next: NextFunction) => void = asyncHandler(
  async (req: Request, res: Response) => {
  const ctx = req.carrierCtx as CarrierContext;
  const result = await carrierService.processWebhook({ context: ctx });
  return res.json(result);
});
