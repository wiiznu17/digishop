// apps/merchant-service/src/middlewares/authenticate.ts
import { Store } from "@digishop/db/src/models/Store";
import { StoreStatus } from "@digishop/db/src/types/enum";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: any;
  authMode?: "service" | "user";
}

export function serviceAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  const expected = process.env.MERCHANT_SERVICE_TOKEN || "";

  if (!expected || !token || token !== expected) return next(); // ไม่ตัดทิ้ง ปล่อยให้ไปลอง auth แบบ user ต่อ

  // ใส่ principal แบบ service (ไม่มี cookie / ไม่มี store binding)
  req.user = { id: 0, sub: 0, role: "SERVICE", email: "merchant-worker@system" };
  req.authMode = "service";
  return next();
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // ถ้า serviceAuth ผ่านมาแล้ว ก็ไม่ต้องเช็ค cookie
  if (req.authMode === "service") return next();

  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded === "string") return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    req.authMode = "user";
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

/**
 * ตรวจว่าร้าน APPROVED
 * - ผ่านเสมอถ้ามาจาก serviceAuth (role=SERVICE)
 * - หา storeId:
 *     1) req.user.storeId (ถ้าระบบ login ยัดมา)
 *     2) req.params.storeId / req.body.storeId / req.query.storeId
 *     3) fallback: หา Store ที่ owner คือ userId = req.user.sub
 */
export function requireApprovedStore(opts?: { allowAdminBypass?: boolean; allowServiceBypass?: boolean }) {
  const { allowServiceBypass = true } = opts ?? {};

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      // Bypass: service principal
      if (allowServiceBypass && req.user.role === "SERVICE") return next();

      // หา storeId
      let storeId: number | undefined =
        (req.user.storeId as number | undefined) ??
        (req.params as any)?.storeId ??
        (req.body as any)?.storeId ??
        (req.query as any)?.storeId;

      if (!storeId) {
        const ownerUserId = Number(req.user.sub);
        if (!Number.isFinite(ownerUserId)) return res.status(400).json({ error: "Missing storeId" });

        const owned = await Store.findOne({ where: { userId: ownerUserId }, attributes: ["id", "status"] });
        if (!owned) return res.status(404).json({ error: "Store not found" });

        storeId = owned.id;
        if (owned.status !== StoreStatus.APPROVED) {
          return res.status(403).json({ error: "Store status is not APPROVED" });
        }
        // เก็บติด req เผื่อ controller ใช้
        (req as any).store = owned;
        return next();
      }

      const store = await Store.findOne({ where: { id: storeId }, attributes: ["id", "status"] });
      if (!store) return res.status(404).json({ error: "Store not found" });
      if (store.status !== StoreStatus.APPROVED) {
        return res.status(403).json({ error: "Store status is not APPROVED" });
      }
      (req as any).store = store;
      return next();
    } catch {
      return res.status(500).json({ error: "Failed to verify store status" });
    }
  };
}

/** ผสม serviceAuth + authenticate: service มาก่อน, ไม่ผ่านค่อยเช็ค cookie */
export function eitherAuth(stack: Array<(req: AuthenticatedRequest, res: Response, next: NextFunction) => any>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let i = 0;
    const step = () => {
      const fn = stack[i++];
      if (!fn) return next();
      fn(req, res, (err?: any) => (err ? next(err) : step()));
    };
    step();
  };
}
