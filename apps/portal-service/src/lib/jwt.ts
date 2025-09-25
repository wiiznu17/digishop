import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { createPrivateKey, createPublicKey, KeyObject } from "crypto";

const ISS = process.env.JWT_ISS || "digishop-portal-service";
const AUD = process.env.JWT_AUD || "digishop-portal";

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[jwt] Missing env ${name}`);
  return v;
}
function fromEnvKey(namePem: string, nameB64?: string): string {
  // base64 -> utf8
  const b64 = nameB64 ? process.env[nameB64] : undefined;
  if (b64 && b64.trim()) return Buffer.from(b64, "base64").toString("utf8").trim();

  // or อ่าน PEM ปกติ แล้วแทน \n เป็น newline
  return must(namePem).replace(/\\n/g, "\n").trim();
}
function toPrivateKey(envPemName: string, envB64Name?: string): KeyObject {
  const pem = fromEnvKey(envPemName, envB64Name);
  try {
    return createPrivateKey(pem);
  } catch (e: any) {
    throw new Error(`[jwt] ${envPemName} invalid PRIVATE key: ${e.message}`);
  }
}
function toPublicKey(envPemName: string, envB64Name?: string): KeyObject {
  const pem = fromEnvKey(envPemName, envB64Name);
  try {
    return createPublicKey(pem);
  } catch (e: any) {
    throw new Error(`[jwt] ${envPemName} invalid PUBLIC key: ${e.message}`);
  }
}

// ---- keys (รองรับทั้ง *_KEY และ *_KEY_B64) ----
// ช่วง dev จะง่ายถ้าใช้ชุดเดียวกันสำหรับ access/refresh ก็ได้
const ACCESS_PRIVATE = toPrivateKey("JWT_ACCESS_PRIVATE_KEY", "JWT_ACCESS_PRIVATE_KEY_B64");
const ACCESS_PUBLIC  = toPublicKey ("JWT_ACCESS_PUBLIC_KEY",  "JWT_ACCESS_PUBLIC_KEY_B64");
const REFRESH_PRIVATE = toPrivateKey("JWT_REFRESH_PRIVATE_KEY", "JWT_REFRESH_PRIVATE_KEY_B64");
const REFRESH_PUBLIC  = toPublicKey ("JWT_REFRESH_PUBLIC_KEY",  "JWT_REFRESH_PUBLIC_KEY_B64");

// ---- options ----
const baseAccessSign: SignOptions = {
  algorithm: "RS256",
  expiresIn: "1M",
  issuer: ISS,
  audience: AUD,
};
const baseRefreshSign: SignOptions = {
  algorithm: "RS256",
  expiresIn: "1H",
  issuer: ISS,
  audience: AUD,
};
const baseVerify: VerifyOptions = {
  algorithms: ["RS256"],
  issuer: ISS,
  audience: AUD,
  clockTolerance: 5,
};

// ---- types ----
type JWTPayload = {
  sub: string | number;
  jti: string;
  [k: string]: any;
};

// ---- api ----
export function signAccess(payload: JWTPayload) {
  return jwt.sign(payload, ACCESS_PRIVATE, baseAccessSign);
}
export function signRefresh(payload: JWTPayload) {
  return jwt.sign(payload, REFRESH_PRIVATE, baseRefreshSign);
}
export function verifyAccess<T = any>(token: string): T {
  return jwt.verify(token, ACCESS_PUBLIC, baseVerify) as T;
}
export function verifyRefresh<T = any>(token: string): T {
  return jwt.verify(token, REFRESH_PUBLIC, baseVerify) as T;
}
