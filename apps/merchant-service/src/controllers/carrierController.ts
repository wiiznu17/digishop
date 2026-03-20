import { Request, Response } from "express";
import { CarrierContext } from "../types/express";
import { CarrierServiceError, carrierService } from "../services/carrierService";

export async function carrierWebhook(req: Request, res: Response) {
  try {
    const ctx = req.carrierCtx as CarrierContext;
    const result = await carrierService.processWebhook({ context: ctx });
    return res.json(result);
  } catch (error) {
    if (error instanceof CarrierServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("carrierWebhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
