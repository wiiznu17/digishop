"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

type Props = {
  /** เรียกเมื่อผ่าน validation แล้ว */
  onSubmit: (payload: {
    password: string
    name?: string
  }) => Promise<void> | void
  /** แสดงช่องชื่อ (ใช้ตอน accept invite) */
  showNameField?: boolean
  /** ค่าเริ่มต้นของชื่อ */
  defaultName?: string
  /** อีเมลผู้ใช้ (ถ้ามี) เพื่อกันใส่ส่วนของอีเมลลงในรหัสผ่าน */
  emailForPII?: string
  /** ป้ายปุ่ม submit */
  submitLabel?: string
  /** disable ทั้งฟอร์ม (ตอนกำลังส่ง) */
  submitting?: boolean
  /** ข้อความ error จากภายนอก (เช่น API error) */
  externalError?: string | null
  /** เปลี่ยนหัวข้อ label */
  title?: string
}

type Rule = { ok: boolean; label: string }

function hasSeq(s: string) {
  const a = "abcdefghijklmnopqrstuvwxyz"
  const A = a.toUpperCase()
  const d = "0123456789"
  const seqs = [a, A, d]
  for (const base of seqs) {
    for (let i = 0; i <= base.length - 4; i++) {
      const part = base.slice(i, i + 4)
      if (s.includes(part)) return true
    }
  }
  return false
}
function hasRepeat(s: string) {
  // อักขระเดียวซ้ำ >=4
  return /(.)\1{3,}/.test(s)
}

function validatePassword(pw: string, name?: string, email?: string) {
  const lower = /[a-z]/.test(pw)
  const upper = /[A-Z]/.test(pw)
  const digit = /[0-9]/.test(pw)
  const symbol = /[^A-Za-z0-9]/.test(pw)
  const noSpace = !/\s/.test(pw)
  const minLen = pw.length >= 10

  const disallowCommon =
    !/(password|letmein|welcome|admin|qwerty|abc123|123456|111111)/i.test(pw)
  const disallowSeq = !hasSeq(pw) && !hasRepeat(pw)

  const local = (email || "").split("@")[0]?.toLowerCase()
  const n = (name || "").toLowerCase().replace(/\s+/g, "")
  const containsLocal = local ? pw.toLowerCase().includes(local) : false
  const containsName = n ? pw.toLowerCase().includes(n) : false
  const disallowPII = !(containsLocal || containsName)

  const ok =
    minLen &&
    lower &&
    upper &&
    digit &&
    symbol &&
    noSpace &&
    disallowCommon &&
    disallowSeq &&
    disallowPII

  const rules: Rule[] = [
    { ok: minLen, label: "ยาวอย่างน้อย 10 ตัวอักษร" },
    { ok: lower, label: "มีตัวพิมพ์เล็ก (a–z)" },
    { ok: upper, label: "มีตัวพิมพ์ใหญ่ (A–Z)" },
    { ok: digit, label: "มีตัวเลข (0–9)" },
    { ok: symbol, label: "มีสัญลักษณ์ (!@#$…)" },
    { ok: noSpace, label: "ไม่มีช่องว่าง" },
    { ok: disallowCommon, label: "ไม่ใช้คำยอดฮิต เช่น password/123456" },
    { ok: disallowSeq, label: "ไม่มีลำดับหรืออักษรซ้ำยาวๆ" },
    { ok: disallowPII, label: "ไม่ใส่ชื่อหรือส่วนของอีเมล" }
  ]

  let score = 0
  for (const r of rules) if (r.ok) score++
  return { ok, rules, score, max: rules.length }
}

export default function PasswordRulesForm({
  onSubmit,
  showNameField,
  defaultName = "",
  emailForPII,
  submitLabel = "Save password",
  submitting,
  externalError,
  title = "Set your password"
}: Props) {
  const [name, setName] = useState(defaultName)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const v = useMemo(
    () => validatePassword(password, name, emailForPII),
    [password, name, emailForPII]
  )
  const match = password.length > 0 && password === confirm
  const canSubmit = v.ok && match && !submitting

  const strengthPct = Math.round((v.score / v.max) * 100)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!v.ok) return setLocalError("Password does not meet the rules.")
    if (!match) return setLocalError("Passwords do not match.")
    await onSubmit({
      password,
      name: showNameField ? name.trim() || undefined : undefined
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {title && <div className="text-lg font-semibold">{title}</div>}

      {showNameField && (
        <div>
          <label className="block text-sm mb-1">Name (optional)</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={submitting}
          />
        </div>
      )}

      <div>
        <label className="block text-sm mb-1">New password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={submitting}
        />
        {/* Strength bar */}
        <div className="mt-2 h-2 w-full rounded bg-muted overflow-hidden">
          <div
            className={`h-2 transition-all ${
              strengthPct < 50
                ? "bg-red-500"
                : strengthPct < 80
                  ? "bg-yellow-500"
                  : "bg-green-600"
            }`}
            style={{ width: `${strengthPct}%` }}
          />
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {v.rules.map((r, i) => (
            <li
              key={i}
              className={`flex items-center gap-2 ${r.ok ? "text-green-600" : "text-muted-foreground"}`}
            >
              {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="block text-sm mb-1">Confirm password</label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={submitting}
        />
        {password && confirm && !match && (
          <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
        )}
      </div>

      {(externalError || localError) && (
        <div className="text-sm text-red-600">
          {externalError ? externalError : localError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}
