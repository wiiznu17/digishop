import { Store, StoreStatus } from "@digishop/db";
import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis/client";
import { verifyAccess, type AccessPayload } from "../lib/jwtVerfify";

export interface AuthenticatedRequest extends Request {
  user?: any;
  authMode?: "service" | "user";
}

// ===== Service-to-service auth (คงเดิม) =====
export function serviceAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  const expected = process.env.MERCHANT_SERVICE_TOKEN || "";

  if (!expected || !token || token !== expected) return next();

  req.user = { id: 0, sub: 0, role: "SERVICE", email: "merchant-worker@system" };
  req.authMode = "service";
  return next();
}

// ===== Helper: ดึง access token จาก header/cookie =====
function readAccessToken(req: Request) {
  const hdr = req.headers.authorization || "";
  if (hdr.startsWith("Bearer ")) return hdr.slice(7).trim();
  // fallback เป็น cookie (กำหนดชื่อ cookie access ตามระบบของคุณ)
  return (req as any).cookies?.["a_t"] || (req as any).cookies?.["token"] || "";
}

// ===== ตรวจ access JWT + session (Redis) =====
// - ใช้ jti จาก access เพื่อผูกกับ refresh-session ปัจจุบัน
// - ตรวจว่าคีย์ session ยังอยู่ใน Redis และไม่ถูก revoke/rotate
// NOTE: ตั้ง prefix ผ่าน ENV ได้ (เช่น "usr:rt", "mer:rt"); ค่าเริ่มต้น "usr:rt"
const SESSION_PREFIX = process.env.SESSION_PREFIX || "usr:rt";
const sessKey = (jti: string) => `${SESSION_PREFIX}:${jti}`;

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // ถ้า serviceAuth ผ่านแล้ว ก็ไม่ต้องเช็คต่อ
  if (req.authMode === "service") return next();

  const token = readAccessToken(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = verifyAccess<AccessPayload>(token);
    // ตรวจ session ใน Redis ด้วย jti
    const key = sessKey(payload.jti);
    const raw = await redis.get(key);
    if (!raw) return res.status(401).json({ error: "SESSION_REVOKED" });

    const sess = JSON.parse(raw) as {
      adminId?: number | string; // ถ้า service public อาจใช้ userId แทนชื่อฟิลด์
      userId?: number | string;
      jti: string;
      revokedAt?: number | null;
      rotatedAt?: number | null;
      expiresAt?: number;
    };

    if (sess.revokedAt) return res.status(401).json({ error: "SESSION_REVOKED" });
    if (sess.rotatedAt) return res.status(401).json({ error: "REFRESH_TOKEN_REUSED" });
    if (sess.expiresAt && sess.expiresAt < Date.now()) {
      return res.status(401).json({ error: "SESSION_EXPIRED" });
    }

    // ปรับ mapping id ให้เข้ากับระบบ merchant
    // - ถ้า authen-service สำหรับ public เก็บเป็น userId ให้ใช้ userId
    // - ถ้าร่วมกับ admin-style ให้ใช้ adminId
    const principalId =
      (sess as any).userId ?? (sess as any).adminId ?? payload.sub;

    req.user = {
      sub: principalId,
      id: principalId,
      jti: payload.jti,
      // เติมข้อมูลอื่น ๆ จาก payload ถ้ามี (เช่น email/roles/storeId)
      ...payload,
    };
    req.authMode = "user";
    return next();
  } catch (e) {
    // verify fail / redis error
    return res.status(401).json({ error: "Unauthorized" });
  }
};

/**
 * ตรวจว่าร้าน APPROVED
 * - ผ่านเสมอถ้ามาจาก serviceAuth (role=SERVICE)
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

/** รวม serviceAuth + authenticate: service มาก่อน, ไม่ผ่านค่อยเช็ค access JWT + Redis */
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
