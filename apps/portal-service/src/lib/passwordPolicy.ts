import { z } from "zod";

const COMMON = /(password|letmein|welcome|admin|qwerty|abc123|123456|111111)/i;
const REPEAT4 = /(.)\1{3,}/;

function hasSeq(s: string) {
  const a = "abcdefghijklmnopqrstuvwxyz";
  const A = a.toUpperCase();
  const d = "0123456789";
  const seqs = [a, A, d];
  for (const base of seqs) {
    for (let i = 0; i <= base.length - 4; i++) {
      const part = base.slice(i, i + 4);
      if (s.includes(part)) return true;
    }
  }
  return false;
}

/** กฎหลักที่ไม่ต้องพึ่ง name/email (ใช้ได้ทั้ง invite/ reset) */
export const PasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .refine((v) => !/\s/.test(v), "Password must not contain whitespace.")
  .refine((v) => /[a-z]/.test(v), "Password needs a lowercase letter.")
  .refine((v) => /[A-Z]/.test(v), "Password needs an uppercase letter.")
  .refine((v) => /[0-9]/.test(v), "Password needs a number.")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Password needs a symbol.")
  .refine((v) => !COMMON.test(v), "Password is too common.")
  .refine((v) => !REPEAT4.test(v) && !hasSeq(v), "Avoid repeated/sequential patterns.");

/** เช็ก PII หลังรู้ name/email แล้ว (ทำหลัง DB lookup) */
export function assertNoPIIInPassword(pw: string, name?: string | null, email?: string | null) {
  const local = (email || "").split("@")[0]?.toLowerCase();
  const normName = (name || "").toLowerCase().replace(/\s+/g, "");
  const lowerPw = pw.toLowerCase();
  if (local && lowerPw.includes(local)) {
    return { ok: false, error: "PASSWORD_CONTAINS_EMAIL" as const };
  }
  if (normName && lowerPw.includes(normName)) {
    return { ok: false, error: "PASSWORD_CONTAINS_NAME" as const };
  }
  return { ok: true as const };
}
