import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { dashboardService, DashboardServiceError } from "../services/dashboardService";

export async function getDashboardSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await dashboardService.getDashboardSummary({
      storeId: req.store?.id,
      userSub: req.user?.sub,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof DashboardServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("[dashboard] getDashboardSummary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
