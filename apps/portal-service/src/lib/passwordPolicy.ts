import { z } from "zod";

/** Core password policy */
export const PasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters long.")
  .refine((v) => !/\s/.test(v), "Password must not contain whitespace.")
  .refine((v) => /[a-z]/.test(v), "Password must include a lowercase letter (a–z).")
  .refine((v) => /[A-Z]/.test(v), "Password must include an uppercase letter (A–Z).")
  .refine((v) => /[0-9]/.test(v), "Password must include a number (0–9).")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Password must include a symbol (!@#$…).");

/** Check PII (name/email) after user context is known */
export function assertNoPIIInPassword(
  pw: string,
  name?: string | null,
  email?: string | null
) {
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
