import { Response } from "express";
import { UnauthorizedError } from "../errors/AppError";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { storeService } from "../services/storeService";
import { asyncHandler } from "../utils/asyncHandler";

export const getStoreStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const result = await storeService.getStoreStatus({ userSub: req.user.sub });
  return res.json(result);
});
