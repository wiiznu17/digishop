import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { AdminPermission, AdminRole, AdminUser } from "@digishop/db";
import { redis } from "../lib/redis/client";
import { toMillis } from "../lib/duration";

const RTK_NAME = process.env.JWT_COOKIE_NAME || "rtk";
const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";   // (เผื่อใช้ denylist ในอนาคต)
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "30d";
const REFRESH_TTL_MS = toMillis(REFRESH_TOKEN_TTL);

const sessKey = (jti: string) => `adm:rt:${jti}`; // refresh session by jti

type RefreshSession = {
  adminId: number | string;
  jti: string;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: number;      // ms epoch
  expiresAt: number;      // ms epoch (for inspect/debug; TTL ของ redis คือ source of truth)
  rotatedAt?: number | null;
  revokedAt?: number | null;
};

// === cookie opts ===
const COOKIE_OPTS: import("express").CookieOptions = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  path: "/",
  ...(IS_PROD ? { partitioned: true as any } : {}),
};

// === LOGIN ===
export const login = async (req: Request, res: Response) => {
  console.log("ip: ", req.ip);
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });

  // ดึง user พร้อมรหัสผ่านให้แน่ใจว่าได้ field
  const user = await AdminUser.findOne({
    where: { email } as any,
    attributes: ["id", "email", "name", "status", "password"] as any,
  });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  console.log("found user: ", (user as any).name);

  if ((user as any).status === "SUSPENDED") {
    return res.status(403).json({ error: "ACCOUNT_SUSPENDED" });
  }

  const ok = await bcrypt.compare(password, (user as any).password);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  console.log("password is correct: ", ok);

  const jti = uuidv4();
  const access = signAccess({ sub: (user as any).id, jti });
  const refresh = signRefresh({ sub: (user as any).id, jti });

  const now = Date.now();
  const sess: RefreshSession = {
    adminId: (user as any).id,
    jti,
    ip: req.ip,
    userAgent: (req.headers["user-agent"] as string) || null,
    createdAt: now,
    expiresAt: now + REFRESH_TTL_MS,
  };

  // เก็บ session ลง Redis + TTL = อายุ refresh token
  await redis.set(sessKey(jti), JSON.stringify(sess), "PX", REFRESH_TTL_MS);

  // (option) index ต่อ user เพื่อ revoke ทั้งหมดได้ง่าย: await redis.sadd(indexKey(sess.adminId), jti);

  res.cookie(RTK_NAME, refresh, { ...COOKIE_OPTS, maxAge: REFRESH_TTL_MS });
  console.log("set cookie: ", RTK_NAME);
  return res.json({ accessToken: access });
};

// === REFRESH (rotation + reuse-detection) ===
export const refresh = async (req: Request, res: Response) => {
  const token = (req as any).cookies?.[RTK_NAME];
  console.log("refreshing token");
  if (!token) return res.status(401).json({ error: "NO_REFRESH" });

  try {
    const payload: any = verifyRefresh(token); // throws if invalid/expired
    const key = sessKey(payload.jti);
    const raw = await redis.get(key);

    if (!raw) {
      // ไม่พบ session ใน Redis => อาจหมด TTL/revoked ไปแล้ว
      return res.status(401).json({ error: "SESSION_REVOKED" });
    }

    const sess = JSON.parse(raw) as RefreshSession;

    if (String(sess.adminId) !== String(payload.sub)) {
      return res.status(401).json({ error: "SESSION_SUB_MISMATCH" });
    }
    if (sess.revokedAt) {
      return res.status(401).json({ error: "SESSION_REVOKED" });
    }
    if (sess.rotatedAt) {
      // reuse-detected: โดนใช้ซ้ำหลังถูกหมุนไปแล้ว
      // revoke ทั้งหมดของ user นี้ (ถ้ามี index), ที่นี่ตอบ 401 กลับไป
      // const jtis = await redis.smembers(indexKey(sess.adminId));
      // for (const j of jtis) await redis.del(sessKey(j));
      return res.status(401).json({ error: "REFRESH_TOKEN_REUSED" });
    }
    if (sess.expiresAt && sess.expiresAt < Date.now()) {
      return res.status(401).json({ error: "SESSION_EXPIRED" });
    }

    // rotate: mark เก่าเป็น rotated+revoked แล้วสร้างใหม่
    const now = Date.now();
    const rotated = { ...sess, rotatedAt: now, revokedAt: now };
    await redis.set(key, JSON.stringify(rotated), "PX", Math.max(1, sess.expiresAt - now)); // ให้หมดพร้อม TTL เดิม

    const newJti = uuidv4();
    const newSess: RefreshSession = {
      adminId: payload.sub,
      jti: newJti,
      ip: req.ip,
      userAgent: (req.headers["user-agent"] as string) || null,
      createdAt: now,
      expiresAt: now + REFRESH_TTL_MS,
    };

    await redis.set(sessKey(newJti), JSON.stringify(newSess), "PX", REFRESH_TTL_MS);
    // (option) await redis.sadd(indexKey(newSess.adminId), newJti);

    const newAccess = signAccess({ sub: payload.sub, jti: newJti });
    const newRefresh = signRefresh({ sub: payload.sub, jti: newJti });

    res.cookie(RTK_NAME, newRefresh, { ...COOKIE_OPTS, maxAge: REFRESH_TTL_MS });
    return res.json({ accessToken: newAccess });
  } catch (e) {
    console.error("refresh error:", e);
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }
};

// === LOGOUT (revoke session ปัจจุบัน) ===
export const logout = async (req: Request, res: Response) => {
  const token = (req as any).cookies?.[RTK_NAME];
  console.log("Logout: ", token);
  try {
    if (token) {
      const payload: any = verifyRefresh(token);
      const key = sessKey(payload.jti);
      const raw = await redis.get(key);
      if (raw) {
        const sess = JSON.parse(raw) as RefreshSession;
        const now = Date.now();
        sess.revokedAt = now;
        await redis.set(key, JSON.stringify(sess), "PX", Math.max(1, (sess.expiresAt || now) - now));
      }
      // (option) ถ้าจะลบออกเลยก็ใช้ await redis.del(key);
    }
  } catch {
    // ignore
  }
  res.clearCookie(RTK_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  return res.json({ ok: true });
};

export const access = async (req: Request, res: Response) => {
  const adminId = (req as any).adminId as number | undefined; // ใส่โดย authenticateAdmin()
  console.log("id to get access: ", adminId);
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
  console.log(permissionSlugs);
  return res.json({
    id: (user as any).id,
    email: (user as any).email,
    roles: roleSlugs,
    permissions: permissionSlugs,
  });
};
