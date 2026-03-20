import { Store } from "@digishop/db";
import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./middleware";

export function attachStore(opts?: { allowServiceBypass?: boolean }) {
  const { allowServiceBypass = false } = opts ?? {};

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (allowServiceBypass && req.user?.role === "SERVICE") {
        return next();
      }

      const ownerUserId = Number(req.user?.sub);
      if (!Number.isFinite(ownerUserId)) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
      }

      const store = await Store.findOne({ where: { userId: ownerUserId } });
      if (!store) {
        return res.status(404).json({ error: "No store found" });
      }

      req.store = store;
      return next();
    } catch (error) {
      console.error("attachStore error:", error);
      return res.status(500).json({ error: "Failed to load store" });
    }
  };
}

export const ensureStore = attachStore();
