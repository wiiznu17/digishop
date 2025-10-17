import { User } from "@digishop/db/src/models/User";
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
  console.log("hdr in service Auth: ", hdr)
  console.log("Token in service Auth: ", token)
  console.log("Expect in service Auth: ", expected)
  console.log("is service: ", !expected || !token || token !== expected)
  if (!expected || !token || token !== expected) return next(); // ไม่ตัดทิ้ง ปล่อยให้ไปลอง auth แบบ user ต่อ

  // ใส่ principal แบบ service (ไม่มี cookie / ไม่มี store binding)
  req.user = {
    id: 0,
    sub: 0,
    role: "SERVICE",
    email: "merchant-worker@system"
  };
  req.authMode = "service";
  console.log("set req.authMode: ", req.authMode)
  return next();
}

// ตรวจ cookies
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // ถ้า serviceAuth ผ่านมาแล้ว ก็ไม่ต้องเช็ค cookie
  console.log("User in authenticae: ", req.authMode)
  if (req.authMode === "service") return next();

  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log("try to decode")
    if (typeof decoded === "string") return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    req.authMode = "user";
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export function requireApprovedUser(opts?: { allowAdminBypass?: boolean; allowServiceBypass?: boolean }) {
  const { allowServiceBypass = true } = opts ?? {};

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      console.log("User in require Approve: ", req.user)
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      console.log("Bypass in require Approve: ", allowServiceBypass)
      console.log("Bypass in require Approve: ", req.user.role)

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
        if (!Number.isFinite(ownerUserId)) return res.status(400).json({ error: "Missing storeId" });

        const owned = await User.findOne({ where: { id: ownerUserId }, attributes: ["id"] });
        if (!owned) return res.status(404).json({ error: "User not found" });

        userId = owned.id;
        return next();
      }

      const user = await User.findOne({ where: { id: userId }, attributes: ["id"] });
      if (!user) return res.status(404).json({ error: "User not found" });
      
      (req as any).user = user;
      console.log("pass pass")
      return next();
    } catch {
      return res.status(500).json({ error: "Failed to verify store status" });
    }
  };
}

/** รวม serviceAuth + authenticate: service มาก่อน, ไม่ผ่านค่อยเช็ค cookie */
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