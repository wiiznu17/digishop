import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { JWTPayload, signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { User } from "@digishop/db";
import { redis } from "../lib/redis/client";
import { toMillis } from "../lib/duration";

const RTK_NAME = process.env.JWT_COOKIE_NAME || "";
const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "30d";
const REFRESH_TTL_MS = toMillis(REFRESH_TOKEN_TTL);

// session keys
const SESSION_PREFIX = process.env.SESSION_PREFIX || "";
const SESSION_INDEX_PREFIX = process.env.SESSION_INDEX_PREFIX || "";

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

const COOKIE_OPTS: import("express").CookieOptions = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  path: "/",
  ...(IS_PROD ? { partitioned: true as any } : {}),
};

// LOGIN: single-session
export const login = async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });

  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "password", "role"],
  });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const jti = uuidv4();
  const access = signAccess({ sub: user.id, jti });
  const refresh = signRefresh({ sub: user.id, jti });

  const now = Date.now();
  const sess: RefreshSession = {
    userId: user.id,
    jti,
    ip: req.ip,
    userAgent: (req.headers["user-agent"] as string) || null,
    createdAt: now,
    expiresAt: now + REFRESH_TTL_MS,
  };

  const idxKey = indexKey(user.id);
  const oldJti = await redis.get(idxKey);
  const pipe = redis.multi();
  if (oldJti) pipe.del(sessKey(oldJti));
  pipe.set(sessKey(jti), JSON.stringify(sess), "PX", REFRESH_TTL_MS);
  pipe.set(idxKey, jti, "PX", REFRESH_TTL_MS);
  await pipe.exec();

  res.cookie(RTK_NAME, refresh, { ...COOKIE_OPTS, maxAge: REFRESH_TTL_MS });
  return res.json({
    accessToken: access,
    user: { id: user.id, email: user.email, role: user.role }
  });
};

// REFRESH: rotate single-session
export const refresh = async (req: Request, res: Response) => {
  console.log("Refresh token request received");
  const token = req.cookies?.[RTK_NAME];
  if (!token) return res.status(401).json({ error: "NO_REFRESH" });

  try {
    const payload = verifyRefresh<JWTPayload>(token);
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

    const now = Date.now();
    const newJti = uuidv4();
    const newSess: RefreshSession = {
      userId: payload.sub,
      jti: newJti,
      ip: req.ip,
      userAgent: (req.headers["user-agent"] as string) || null,
      createdAt: now,
      expiresAt: now + REFRESH_TTL_MS,
    };

    const idxKey = indexKey(payload.sub);
    const pipe = redis.multi();
    pipe.del(key);
    pipe.set(sessKey(newJti), JSON.stringify(newSess), "PX", REFRESH_TTL_MS);
    pipe.set(idxKey, newJti, "PX", REFRESH_TTL_MS);
    await pipe.exec();

    const newAccess = signAccess({ sub: payload.sub, jti: newJti });
    const newRefresh = signRefresh({ sub: payload.sub, jti: newJti });
    res.cookie(RTK_NAME, newRefresh, { ...COOKIE_OPTS, maxAge: REFRESH_TTL_MS });
    console.log("Refresh token rotated successfully");
    return res.json({ accessToken: newAccess });
  } catch (e) {
    console.error("refresh error:", e);
    res.clearCookie(RTK_NAME, { ...COOKIE_OPTS, maxAge: undefined });
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response) => {
  const token = (req as any).cookies?.[RTK_NAME];
  try {
    if (token) {
      const payload: any = verifyRefresh<JWTPayload>(token);
      const key = sessKey(payload.jti);
      const idxKey = indexKey(payload.sub);
      const current = await redis.get(idxKey);
      const pipe = redis.multi();
      pipe.del(key);
      if (current === payload.jti) pipe.del(idxKey);
      await pipe.exec();
    }
  } catch {
    // ignore
  }
  res.clearCookie(RTK_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  return res.json({ ok: true });
};

// /me (ต้องมี middleware ใส่ userId แล้ว)
export const access = async (req: Request, res: Response) => {
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const user = await User.findByPk(userId, { attributes: ["id", "email", "role"] });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });
  return res.json({ id: (user as any).id, email: (user as any).email, role: (user as any).role });
};
