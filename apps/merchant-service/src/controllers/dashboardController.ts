import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { dashboardService } from "../services/dashboardService";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboardSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await dashboardService.getDashboardSummary({
    storeId: req.store?.id,
    userSub: req.user?.sub,
  });

  return res.json(result);
});
