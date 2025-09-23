import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { AdminUser } from "@digishop/db/src/models/portal/AdminUser";
import { AdminSession } from "@digishop/db/src/models/portal/AdminSession";
import { AdminRole } from "@digishop/db/src/models/portal/AdminRole";
import { AdminPermission } from "@digishop/db/src/models/portal/AdminPermission";

// cookie name + opts (prod: secure=true)
const RTK_NAME = process.env.JWT_COOKIE_NAME || "rtk";
const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, secure: false, path: "/" };

export const login = async (req: Request, res: Response) => {
  console.log("ip: ", req.ip)
  console.log("headers: ", req.headers["user-agent"])
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  console.log("login with email: ", email)
  console.log("login with password: ", password)
  if (!email || !password) return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });

  const user = await AdminUser.findOne({ where: { email } as any });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  console.log("found user: ", user)
  if ((user as any).status === "SUSPENDED") {
    return res.status(403).json({ error: "ACCOUNT_SUSPENDED" });
  }
  const ok = await bcrypt.compare(password, (user as any).password);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  console.log("password is correct: ", ok)
  // TODO (MFA): ถ้าพบ factor ให้สร้าง challenge แล้วตอบ { mfa_required:true, challenge_id }
  const jti = uuidv4();
  console.log("jti: ", jti)
  const access = signAccess({ sub: (user as any).id, jti });
  // console.log("access token: ", access)
  const refresh = signRefresh({ sub: (user as any).id, jti });
  // console.log("refresh token: ", refresh)

  await AdminSession.create({
    adminId: (user as any).id,
    jti,
    ip: req.ip,
    userAgent: (req.headers["user-agent"] as string) || null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 วัน
  } as any);
  console.log("seesion is created")
  res.cookie(RTK_NAME, refresh, { ...COOKIE_OPTS, maxAge: 30 * 24 * 3600 * 1000 });
  return res.json({ accessToken: access });
};

export const refresh = async (req: Request, res: Response) => {
  const token = (req as any).cookies?.[RTK_NAME];
  if (!token) return res.status(401).json({ error: "NO_REFRESH" });

  try {
    const payload: any = verifyRefresh(token);

    const sess = await AdminSession.findOne({
      where: { adminId: payload.sub, jti: payload.jti, revokedAt: null } as any,
    });
    if (!sess) return res.status(401).json({ error: "SESSION_REVOKED" });

    // rotate session
    const newJti = uuidv4();
    await sess.update({ revokedAt: new Date() } as any);
    await AdminSession.create({
      adminId: payload.sub,
      jti: newJti,
      ip: req.ip,
      userAgent: (req.headers["user-agent"] as string) || null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    } as any);

    const newAccess = signAccess({ sub: payload.sub, jti: newJti });
    const newRefresh = signRefresh({ sub: payload.sub, jti: newJti });

    res.cookie(RTK_NAME, newRefresh, { ...COOKIE_OPTS, maxAge: 30 * 24 * 3600 * 1000 });
    return res.json({ accessToken: newAccess });
  } catch {
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = (req as any).cookies?.[RTK_NAME];
  console.log("Logout: ", token)
  try {
    if (token) {
      const payload: any = verifyRefresh(token);
      await AdminSession.update(
        { revokedAt: new Date() } as any,
        { where: { adminId: payload.sub, jti: payload.jti } }
      );
    }
  } catch {
    // ignore
  }
  res.clearCookie(RTK_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  return res.json({ ok: true });
};

export const access = async (req: Request, res: Response) => {
  const adminId = (req as any).adminId as number | undefined; // ใส่โดย authenticateAdmin()
  console.log("id to get access: ", adminId)
  if (!adminId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const user = await AdminUser.findByPk(adminId, {
    attributes: ["id", "email"],
    include: [
      {
        model: AdminRole,
        as: "roles",
        attributes: ["slug"],
        through: { attributes: [] },     // ไม่ต้องส่งฟิลด์จากตารางกลาง
        include: [
          {
            model: AdminPermission,
            as: "permissions",
            attributes: ["slug"],
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!user) return res.status(404).json({ error: "ADMIN_NOT_FOUND" });

  // map roles
  const roleSlugs = (user as any).roles?.map((r: any) => r.slug) ?? [];

  // flatten permissions จากทุก role แล้ว dedupe
  const permSet = new Set<string>();
  for (const r of (user as any).roles ?? []) {
    for (const p of r.permissions ?? []) {
      if (p?.slug) permSet.add(p.slug);
    }
  }
  const permissionSlugs = Array.from(permSet);
  console.log("rturn access: ", user.id)
  console.log("rturn access: ", user.email)
  console.log("rturn access: ", roleSlugs)
  console.log("rturn access: ", permissionSlugs)
  return res.json({
    id: (user as any).id,
    email: (user as any).email,
    roles: roleSlugs,
    permissions: permissionSlugs,
  });
};