import { Request, Response } from "express";
import { ReturnCarrierContext } from "../types/express";
import {
  ReturnCarrierServiceError,
  returnCarrierService,
} from "../services/returnCarrierService";

export async function returnCarrierWebhook(req: Request, res: Response) {
  try {
    const ctx = req.returnCarrierCtx as ReturnCarrierContext;
    const result = await returnCarrierService.processWebhook({ context: ctx });
    return res.json(result);
  } catch (error) {
    if (error instanceof ReturnCarrierServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("returnCarrierWebhook error:", error);
    return res.status(500).json({ error: "Return webhook processing failed" });
  }
}

export async function markReturnFailed(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const result = await returnCarrierService.markReturnFailed({ returnShipmentId: id });
    return res.json(result);
  } catch (error) {
    if (error instanceof ReturnCarrierServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("markReturnFailed error:", error);
    return res.status(500).json({ error: "mark_return_failed" });
  }
}
