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

function toPublicKey(envPemName: string, envB64Name?: string): KeyObject {
  const pem = fromEnvKey(envPemName, envB64Name);
  try {
    return createPublicKey(pem);
  } catch (e: any) {
    throw new Error(`[jwt] ${envPemName} invalid PUBLIC key: ${e.message}`);
  }
}

const ACCESS_PUBLIC  = toPublicKey ("JWT_ACCESS_PUBLIC_KEY",  "JWT_ACCESS_PUBLIC_KEY_B64");

const baseVerify: VerifyOptions = {
  algorithms: ["RS256"],
  issuer: ISS,
  audience: AUD,
  clockTolerance: 5,
};

// ---- types ----
export type JWTPayload = {
  sub: string | number;
  jti: string;
  [k: string]: any;
};

export function verifyAccess<T = JWTPayload>(token: string): T {
  return jwt.verify(token, ACCESS_PUBLIC, baseVerify) as T;
}
