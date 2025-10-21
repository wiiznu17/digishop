import { Store, StoreStatus } from "@digishop/db";
import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis/client";
import { verifyAccess, type JWTPayload } from "../lib/jwtVerfify";

export interface AuthenticatedRequest extends Request {
  user?: any;
  authMode?: "service" | "user";
}

// service bypass from bullMQ worker
export function serviceAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7).trim() : "";
  const expected = (process.env.MERCHANT_SERVICE_TOKEN || "").trim();
  if (!expected || !token || token !== expected) return next();
  req.user = {
    id: 0,
    sub: 0,
    role: "SERVICE",
    email: "merchant-worker@system"
  };
  req.authMode = "service";
  return next();
}

function readAccessToken(req: Request) {
  const hdr = req.headers.authorization || "";
  if (hdr.startsWith("Bearer ")) return hdr.slice(7).trim();
  return null;
}

const SESSION_PREFIX = process.env.SESSION_PREFIX || "";
const sessKey = (jti: string) => `${SESSION_PREFIX}:${jti}`;

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.authMode === "service") return next();

  const token = readAccessToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = verifyAccess<JWTPayload>(token);
    if (!payload?.jti) return res.status(401).json({ error: "Unauthorized" });

    const raw = await redis.get(sessKey(payload.jti));
    if (!raw) return res.status(401).json({ error: "SESSION_REVOKED" });

    const sess = JSON.parse(raw) as {
      userId?: number | string;
      jti: string;
      expiresAt?: number
    };
    if (sess.expiresAt && sess.expiresAt < Date.now()) return res.status(401).json({ error: "SESSION_EXPIRED" });

    const principalId = (sess.userId ?? payload.sub) as number | string;

    req.user = {
      ...payload,              // ข้อมูลใน JWT email, role,
      id: principalId,         // เพิ่ม id (mapping จาก userId)
      sub: principalId,        // แทน sub เดิมด้วย principalId
    };
    req.authMode = "user";
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export function requireApprovedStore(opts?: { allowAdminBypass?: boolean; allowServiceBypass?: boolean }) {
  const { allowServiceBypass = true } = opts ?? {};
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      if (allowServiceBypass && req.user.role === "SERVICE") return next();

      let storeId: number | undefined =
        (req.user.storeId as number | undefined) ??
        (req.params as any)?.storeId ??
        (req.body as any)?.storeId ??
        (req.query as any)?.storeId;

      if (!storeId) {
        const ownerUserId = Number(req.user.sub);
        if (!Number.isFinite(ownerUserId)) return res.status(400).json({ error: "Missing storeId" });
        const owned = await Store.findOne({
          where: { userId: ownerUserId },
          attributes: ["id", "status"]
        });
        if (!owned) return res.status(404).json({ error: "Store not found" });
        if (owned.status !== StoreStatus.APPROVED) return res.status(403).json({ error: "Store status is not APPROVED" });
        (req as any).store = owned;
        return next();
      }

      const store = await Store.findOne({
        where: { id: storeId },
        attributes: ["id", "status"]
      });
      if (!store) return res.status(404).json({ error: "Store not found" });
      if (store.status !== StoreStatus.APPROVED) return res.status(403).json({ error: "Store status is not APPROVED" });
      (req as any).store = store;
      return next();
    } catch {
      return res.status(500).json({ error: "Failed to verify store status" });
    }
  };
}

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
