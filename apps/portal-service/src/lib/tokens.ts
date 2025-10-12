import crypto from "crypto";

export function genTokenRaw(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
export function sha256b64(s: string): string {
  return crypto.createHash("sha256").update(s).digest("base64");
}
export function addHours(h: number, from = new Date()) {
  const d = new Date(from);
  d.setHours(d.getHours() + h);
  return d;
}
