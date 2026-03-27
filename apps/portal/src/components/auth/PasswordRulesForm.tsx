'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

type Props = {
  onSubmit: (payload: {
    password: string
    name?: string
  }) => Promise<void> | void
  showNameField?: boolean
  defaultName?: string
  /** kept for compatibility with callers; not used in the 6-rule policy */
  emailForPII?: string
  submitLabel?: string
  submitting?: boolean
  externalError?: string | null
  title?: string
}

type Rule = { ok: boolean; label: string }

function validatePassword(pw: string) {
  const lower = /[a-z]/.test(pw)
  const upper = /[A-Z]/.test(pw)
  const digit = /[0-9]/.test(pw)
  const symbol = /[^A-Za-z0-9]/.test(pw)
  const noSpace = !/\s/.test(pw)
  const minLen = pw.length >= 10
  const ok = minLen && lower && upper && digit && symbol && noSpace

  const rules: Rule[] = [
    { ok: minLen, label: 'At least 10 characters long' },
    { ok: lower, label: 'Contains a lowercase letter (a–z)' },
    { ok: upper, label: 'Contains an uppercase letter (A–Z)' },
    { ok: digit, label: 'Contains a number (0–9)' },
    { ok: symbol, label: 'Contains a symbol (!@#$…)' },
    { ok: noSpace, label: 'No whitespace' }
  ]

  let score = 0
  for (const r of rules) if (r.ok) score++
  return { ok, rules, score, max: rules.length }
}

export default function PasswordRulesForm({
  onSubmit,
  showNameField,
  defaultName = '',
  emailForPII, // kept for backward compatibility
  submitLabel = 'Save password',
  submitting,
  externalError,
  title = 'Set your password'
}: Props) {
  const [name, setName] = useState(defaultName)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const v = useMemo(() => validatePassword(password), [password])
  const match = password.length > 0 && password === confirm
  const canSubmit = v.ok && match && !submitting

  const strengthPct = Math.round((v.score / v.max) * 100)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!v.ok) return setLocalError('Password does not meet the rules.')
    if (!match) return setLocalError('Passwords do not match.')
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
        <div className="mt-2 h-2 w-full rounded bg-muted overflow-hidden">
          <div
            className={`h-2 transition-all ${
              strengthPct < 50
                ? 'bg-red-500'
                : strengthPct < 80
                  ? 'bg-yellow-500'
                  : 'bg-green-600'
            }`}
            style={{ width: `${strengthPct}%` }}
          />
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {v.rules.map((r, i) => (
            <li
              key={i}
              className={`flex items-center gap-2 ${
                r.ok ? 'text-green-600' : 'text-muted-foreground'
              }`}
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
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
