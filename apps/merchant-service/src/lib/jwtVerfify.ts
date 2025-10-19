import jwt, { VerifyOptions } from "jsonwebtoken";
import { createPublicKey } from "crypto";

const ISS = process.env.JWT_ISS || "digishop-portal-service";
const AUD = process.env.JWT_AUD || "digishop-portal";

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[jwt] Missing env ${name}`);
  return v;
}
function fromEnvKey(namePem: string, nameB64?: string): string {
  const b64 = nameB64 ? process.env[nameB64] : undefined;
  if (b64 && b64.trim()) return Buffer.from(b64, "base64").toString("utf8").trim();
  return must(namePem).replace(/\\n/g, "\n").trim();
}

const ACCESS_PUBLIC = createPublicKey(
  fromEnvKey("JWT_ACCESS_PUBLIC_KEY", "JWT_ACCESS_PUBLIC_KEY_B64")
);

const baseVerify: VerifyOptions = {
  algorithms: ["RS256"],
  issuer: ISS,
  audience: AUD,
  clockTolerance: 5,
};

export type AccessPayload = {
  sub: string | number;
  jti: string;
  [k: string]: any;
};

export function verifyAccess<T = AccessPayload>(token: string): T {
  return jwt.verify(token, ACCESS_PUBLIC, baseVerify) as T;
}
