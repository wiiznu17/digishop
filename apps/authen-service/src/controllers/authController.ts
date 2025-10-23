import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { JWTPayload, signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { User } from "@digishop/db";
import { redis } from "../lib/redis/client";
import { toMillis } from "../lib/duration";

const IS_PROD = process.env.NODE_ENV === "production";

// ชื่อคุกกี้
const ATK_NAME = process.env.JWT_ACCESS_COOKIE_NAME || "access_token";
const RTK_NAME = process.env.JWT_REFRESH_COOKIE_NAME || "refresh_token";

// อายุโทเคน
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "30d";
const ACCESS_TTL_MS = toMillis(ACCESS_TOKEN_TTL);
const REFRESH_TTL_MS = toMillis(REFRESH_TOKEN_TTL);

// ตั้งค่า base cookie
const BASE_COOKIE: import("express").CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  ...(IS_PROD ? ({ partitioned: true } as any) : {})
};

// refresh cookie เราจะบีบ path ให้เรียกได้เฉพาะ /api/auth/refresh
const REFRESH_COOKIE: import("express").CookieOptions = {
  ...BASE_COOKIE,
  path: "/api/auth/refresh"
};

// Redis session key
const SESSION_PREFIX = process.env.SESSION_PREFIX || "usr:rt";
const SESSION_INDEX_PREFIX = process.env.SESSION_INDEX_PREFIX || "usr:rt:idx";

const sessKey = (jti: string) => `${SESSION_PREFIX}:${jti}`;
const indexKey = (userId: string | number) => `${SESSION_INDEX_PREFIX}:${userId}`;

type RefreshSession = {
  userId: number | string;
  jti: string;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: number;
  expiresAt: number;
};

// (access + refresh)
function setAuthCookies(res: Response, accessJwt: string, refreshJwt: string) {
  res.cookie(ATK_NAME, accessJwt, { ...BASE_COOKIE, maxAge: ACCESS_TTL_MS });
  res.cookie(RTK_NAME, refreshJwt, { ...REFRESH_COOKIE, maxAge: REFRESH_TTL_MS });
}

// clear both cookies
function clearAuthCookies(res: Response) {
  res.clearCookie(ATK_NAME, { ...BASE_COOKIE, maxAge: undefined });
  res.clearCookie(RTK_NAME, { ...REFRESH_COOKIE, maxAge: undefined });
}

// LOGIN: single-session (revoke old then create new)
export const login = async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });

  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "password", "role"]
  });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const jti = uuidv4();
  const access = signAccess({ sub: user.id, jti });   // อายุสั้น
  const refresh = signRefresh({ sub: user.id, jti }); // อายุยาว

  const now = Date.now();
  const sess: RefreshSession = {
    userId: user.id,
    jti,
    ip: req.ip,
    userAgent: (req.headers["user-agent"] as string) || null,
    createdAt: now,
    expiresAt: now + REFRESH_TTL_MS
  };

  // revoke session เก่า → set session ใหม่
  const idxKey = indexKey(user.id);
  const oldJti = await redis.get(idxKey);
  const pipe = redis.multi();
  if (oldJti) pipe.del(sessKey(oldJti));
  pipe.set(sessKey(jti), JSON.stringify(sess), "PX", REFRESH_TTL_MS);
  pipe.set(idxKey, jti, "PX", REFRESH_TTL_MS);
  await pipe.exec();

  setAuthCookies(res, access, refresh);
  return res.json({
    ok: true,
    user: { id: user.id, email: user.email, role: user.role }
  });
};

// REFRESH: single-session rotate (delete old, create new)
export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[RTK_NAME];
  if (!token) return res.status(401).json({ error: "NO_REFRESH" });

  try {
    const payload = verifyRefresh<JWTPayload>(token); // throws if invalid/expired
    const key = sessKey(payload.jti);
    const raw = await redis.get(key);
    if (!raw) return res.status(401).json({ error: "SESSION_REVOKED" });

    const sess = JSON.parse(raw) as RefreshSession;
    if (String(sess.userId) !== String(payload.sub)) {
      return res.status(401).json({ error: "SESSION_SUB_MISMATCH" });
    }
    if (sess.expiresAt && sess.expiresAt < Date.now()) {
      return res.status(401).json({ error: "SESSION_EXPIRED" });
    }

    // rotate
    const now = Date.now();
    const newJti = uuidv4();
    const newSess: RefreshSession = {
      userId: payload.sub,
      jti: newJti,
      ip: req.ip,
      userAgent: (req.headers["user-agent"] as string) || null,
      createdAt: now,
      expiresAt: now + REFRESH_TTL_MS
    };

    const idxKey = indexKey(payload.sub);
    const pipe = redis.multi();
    pipe.del(key); // ลบอันเก่า
    pipe.set(sessKey(newJti), JSON.stringify(newSess), "PX", REFRESH_TTL_MS);
    pipe.set(idxKey, newJti, "PX", REFRESH_TTL_MS);
    await pipe.exec();

    const newAccess = signAccess({ sub: payload.sub, jti: newJti });
    const newRefresh = signRefresh({ sub: payload.sub, jti: newJti });

    setAuthCookies(res, newAccess, newRefresh);
    return res.json({ ok: true }); // ไม่ต้องคืน accessToken แล้ว FE จะพึ่งคุกกี้อย่างเดียว
  } catch (e) {
    clearAuthCookies(res);
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }
};

// LOGOUT: revoke session & clear cookies
export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.[RTK_NAME];
  try {
    if (token) {
      const payload: any = verifyRefresh<JWTPayload>(token);
      const key = sessKey(payload.jti);
      const idx = indexKey(payload.sub);
      const current = await redis.get(idx);
      const pipe = redis.multi();
      pipe.del(key);
      if (current === payload.jti) pipe.del(idx);
      await pipe.exec();
    }
  } catch {
    // ignore
  }
  clearAuthCookies(res);
  return res.json({ ok: true });
};

// ต้องมี middleware ใส่ userId ลง req (จาก access cookie)
export const access = async (req: Request, res: Response) => {
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const user = await User.findByPk(userId, { attributes: ["id", "email", "role"] });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

  return res.json({ id: (user as any).id, email: (user as any).email, role: (user as any).role });
};
