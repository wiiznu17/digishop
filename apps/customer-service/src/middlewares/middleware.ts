import { User } from "@digishop/db";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis";
import { JWTPayload, verifyAccess } from "../lib/jwtVerify";

export interface AuthenticatedRequest extends Request {
  user?: any;
  authMode?: "service" | "user";
}
export function serviceAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : ""; //access token ไม่ได้ใส่ Bearer
  const expected = process.env.MERCHANT_SERVICE_TOKEN || "";
  console.log("hdr in service Auth: ", hdr);
  console.log("Token in service Auth: ", token);
  console.log("Expect in service Auth: ", expected);
  console.log("is service: ", !expected || !token || token !== expected);
  if (!expected || !token || token !== expected) return next(); // ไม่ตัดทิ้ง ปล่อยให้ไปลอง auth แบบ user ต่อ

  // ใส่ principal แบบ service (ไม่มี cookie / ไม่มี store binding)
  req.user = {
    id: 0,
    sub: 0,
    role: "SERVICE",
    email: "merchant-worker@system",
  };
  req.authMode = "service";
  console.log("set req.authMode: ", req.authMode);
  return next();
}

// function readAccessToken(req: Request) {
//   const hdr = req.headers.authorization || "";
//   if (hdr.startsWith("Bearer ")) return hdr.slice(7).trim();
//   return null;
// }

const SESSION_PREFIX = process.env.SESSION_PREFIX || "";
const sessKey = (jti: string) => `${SESSION_PREFIX}:${jti}`;
const ATK_NAME = process.env.JWT_ACCESS_COOKIE_NAME || "access_token";

// ตรวจ cookies
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // ถ้า serviceAuth ผ่านมาแล้ว ก็ไม่ต้องเช็ค cookie
  const token = (req as any).cookies?.[ATK_NAME];
  console.log('token',req.cookies , )
  if (!token) return res.status(401).json({ error: "Unauthorized no token" });

  try {
    const payload = verifyAccess<JWTPayload>(token);
    if (!payload?.jti) return res.status(401).json({ error: "Unauthorized no payload" });

    const raw = await redis.get(sessKey(payload.jti));
    if (!raw) return res.status(401).json({ error: "SESSION_REVOKED" });

    const sess = JSON.parse(raw) as {
      userId?: number | string;
      jti: string;
      expiresAt?: number;
    };
    if (sess.expiresAt && sess.expiresAt < Date.now())
      return res.status(401).json({ error: "SESSION_EXPIRED" });

    const principalId = (sess.userId ?? payload.sub) as number | string;

    req.user = {
      ...payload, // ข้อมูลใน JWT email, role,
      id: principalId, // เพิ่ม id (mapping จาก userId)
      sub: principalId, // แทน sub เดิมด้วย principalId
    };
    req.authMode = "user";
    return next();
  } catch (err){
    return res.status(401).json({ error: err });
  }
};

export function requireApprovedUser(opts?: {
  allowAdminBypass?: boolean;
  allowServiceBypass?: boolean;
}) {
  const { allowServiceBypass = true } = opts ?? {};

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // console.log("User in require Approve: ", req.user)
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      // console.log("Bypass in require Approve: ", allowServiceBypass)
      // console.log("Bypass in require Approve: ", req.user.role)

      // Bypass: service principal
      if (allowServiceBypass && req.user.role === "SERVICE") return next();

      // หา storeId
      let userId: number | undefined =
        (req.user.userId as number | undefined) ??
        (req.params as any)?.userId ??
        (req.body as any)?.userId ??
        (req.query as any)?.userId;

      if (!userId) {
        const ownerUserId = Number(req.user.sub);
        if (!Number.isFinite(ownerUserId))
          return res.status(400).json({ error: "Missing storeId" });

        const owned = await User.findOne({
          where: { id: ownerUserId },
          attributes: ["id"],
        });
        if (!owned) return res.status(404).json({ error: "User not found" });

        userId = owned.id;
        return next();
      }

      const user = await User.findOne({
        where: { id: userId },
        attributes: ["id"],
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      (req as any).user = user;
      console.log("pass pass");
      return next();
    } catch {
      return res.status(500).json({ error: "Failed to verify store status" });
    }
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"];
  const JWT_SECRET = process.env.JWT_SECRET || "";
  console.log("token", token);
  if (token == null) {
    res.sendStatus(401);
    return;
  }
  //เทียบ token อยู่ใน header ต้อง decode ได้ JWT_SECRET ที่เราใช้ gen ตอนแรก
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    req.user = user;
    next();
  });
};

/** รวม serviceAuth + authenticate: service มาก่อน, ไม่ผ่านค่อยเช็ค cookie */
export function eitherAuth(
  stack: Array<
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => any
  >
) {
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
