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

const sessKey = (jti: string) => `${SESSION_PREFIX}:${jti}`; // session by jti
// ex usr:rt:jti-abc-xyz -> { userId, jti, ip, userAgent, createdAt, expiresAt }
const indexKey = (userId: string | number) => `${SESSION_INDEX_PREFIX}:${userId}`; // current jti pointer per user
// ex usr:rt:idx:123 -> "jti-abc-xyz"

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

// LOGIN: single-session (revoke old then create new)
export const login = async (req: Request, res: Response) => {
  const {
    email,
    password
  } = (req.body ?? {}) as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: "EMAIL_PASSWORD_REQUIRED" });

  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "password", "role"],
  });
  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const jti = uuidv4(); // session ID
  const access = signAccess({ sub: user.id, jti }); // access token
  const refresh = signRefresh({ sub: user.id, jti }); // refresh token

  const now = Date.now();
  const sess: RefreshSession = {
    userId: user.id,
    jti,
    ip: req.ip,
    userAgent: (req.headers["user-agent"] as string) || null,
    createdAt: now,
    expiresAt: now + REFRESH_TTL_MS,
  };

  // if already logged in, revoke old session
  const idxKey = indexKey(user.id); // key ที่เก็บ jti ปัจจุบันของ user
  console.log("Setting session for user:", user.id, "with jti:", jti);
  const oldJti = await redis.get(idxKey); // ดึง jti เดิม
  const pipe = redis.multi(); // ใช้ transaction
  if (oldJti) pipe.del(sessKey(oldJti)); // ลบ session เก่า
  pipe.set(sessKey(jti), JSON.stringify(sess), "PX", REFRESH_TTL_MS); // สร้าง session ใหม่
  pipe.set(idxKey, jti, "PX", REFRESH_TTL_MS); // อัปเดต jti ปัจจุบัน
  await pipe.exec();
  // log session from redis
  console.log("User logged in, session created:", sess);
  res.cookie(RTK_NAME, refresh, { ...COOKIE_OPTS, maxAge: REFRESH_TTL_MS });
  return res.json({
    accessToken: access,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
};

// REFRESH: single-session rotate (delete old, create new)
export const refresh = async (req: Request, res: Response) => {
  console.log("Refresh token request received");
  const token = req.cookies?.[RTK_NAME];
  if (!token) return res.status(401).json({ error: "NO_REFRESH" });
  console.log("Refresh token from cookie:", token);

  try {
    const payload = verifyRefresh<JWTPayload>(token); // throws if invalid/expired
    console.log("Refresh token payload verified:", payload);
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
    // ลบ session เก่าและแทน index เป็น jti ใหม่
    pipe.del(key);
    pipe.set(sessKey(newJti), JSON.stringify(newSess), "PX", REFRESH_TTL_MS);
    pipe.set(idxKey, newJti, "PX", REFRESH_TTL_MS);
    await pipe.exec();

    const newAccess = signAccess({ sub: payload.sub, jti: newJti });
    const newRefresh = signRefresh({ sub: payload.sub, jti: newJti });
    console.log("Issuing new access and refresh tokens");
    res.cookie(RTK_NAME, newRefresh, { ...COOKIE_OPTS, maxAge: REFRESH_TTL_MS });
    return res.json({ accessToken: newAccess });
  } catch (e) {
    console.error("Error during refresh token processing:", e);
    res.clearCookie(RTK_NAME, { ...COOKIE_OPTS, maxAge: undefined });
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }
};

// LOGOUT: delete current session and clear index if pointing to it
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
    // ignore invalid refresh
    res.json({ ok: false, error: "LOGOUT_FAILED" });
  }
  res.clearCookie(RTK_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  return res.json({ ok: true });
};

// ต้องมี middleware ใส่ userId ลง req
export const access = async (req: Request, res: Response) => {
  const userId = (req as any).userId as number | undefined;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const user = await User.findByPk(userId, { attributes: ["id", "email", "role"] });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

  return res.json({ id: (user as any).id, email: (user as any).email, role: (user as any).role });
};
