import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { AdminPermission, AdminRole, AdminSession, AdminUser } from "@digishop/db";

const IS_PROD = process.env.NODE_ENV === "production";
const ATK_NAME = process.env.JWT_ACCESS_COOKIE_NAME || "access_token";
const RTK_NAME = process.env.JWT_REFRESH_COOKIE_NAME || "refresh_token";

const ACCESS_TTL_MS = 15 * 60 * 1000;          // 15 นาที (ปรับตาม env ได้)
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 วัน

// ค่าคุกกี้ฐาน
const BASE_COOKIE: import("express").CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",          // ถ้า cross-site จริงค่อยปรับเป็น 'none'
  path: "/",
  ...(IS_PROD ? ({ partitioned: true } as any) : {})
};
// refresh cookie ผูกเฉพาะ path /api/auth/refresh
const REFRESH_COOKIE: import("express").CookieOptions = {
  ...BASE_COOKIE,
  path: "/api/auth/refresh"
};

function setAuthCookies(res: Response, accessJwt: string, refreshJwt: string) {
  res.cookie(ATK_NAME, accessJwt, { ...BASE_COOKIE, maxAge: ACCESS_TTL_MS });
  res.cookie(RTK_NAME, refreshJwt, { ...REFRESH_COOKIE, maxAge: REFRESH_TTL_MS });
}
function clearAuthCookies(res: Response) {
  res.clearCookie(ATK_NAME, { ...BASE_COOKIE, maxAge: undefined });
  res.clearCookie(RTK_NAME, { ...REFRESH_COOKIE, maxAge: undefined });
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });

  const user = await AdminUser.findOne({ where: { email } as any });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  if ((user as any).status === "SUSPENDED") {
    return res.status(403).json({ error: "ACCOUNT_SUSPENDED" });
  }
  const ok = await bcrypt.compare(password, (user as any).password);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const jti = uuidv4();
  const access = signAccess({ sub: (user as any).id, jti });
  const refresh = signRefresh({ sub: (user as any).id, jti });

  await AdminSession.create({
    adminId: (user as any).id,
    jti,
    ip: req.ip,
    userAgent: (req.headers["user-agent"] as string) || null,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  } as any);

  setAuthCookies(res, access, refresh);
  return res.json({ ok: true });
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
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    } as any);

    const newAccess = signAccess({ sub: payload.sub, jti: newJti });
    const newRefresh = signRefresh({ sub: payload.sub, jti: newJti });

    setAuthCookies(res, newAccess, newRefresh);
    return res.json({ ok: true }); // ไม่ต้องส่ง accessToken กลับแล้ว
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = (req as any).cookies?.[RTK_NAME];
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
  clearAuthCookies(res);
  return res.json({ ok: true });
};

export const access = async (req: Request, res: Response) => {
  const adminId = (req as any).adminId as number | undefined; // ใส่โดย authenticateAdmin()
  if (!adminId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const user = await AdminUser.findByPk(adminId, {
    attributes: ["id", "email"],
    include: [
      {
        model: AdminRole,
        as: "roles",
        attributes: ["slug"],
        through: { attributes: [] },
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

  const roleSlugs = (user as any).roles?.map((r: any) => r.slug) ?? [];
  const permSet = new Set<string>();
  for (const r of (user as any).roles ?? []) {
    for (const p of r.permissions ?? []) {
      if (p?.slug) permSet.add(p.slug);
    }
  }
  const permissionSlugs = Array.from(permSet);

  return res.json({
    id: (user as any).id,
    email: (user as any).email,
    roles: roleSlugs,
    permissions: permissionSlugs,
  });
};
