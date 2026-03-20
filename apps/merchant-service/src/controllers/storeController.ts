import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { StoreServiceError, storeService } from "../services/storeService";

export async function getStoreStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const result = await storeService.getStoreStatus({ userSub: req.user.sub });
    return res.json(result);
  } catch (error) {
    if (error instanceof StoreServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("[getMyStoreStatus] error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
