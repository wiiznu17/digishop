"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { login } from "@/utils/requesters/authRequester"

export default function LoginPage() {
  const [email, setEmail] = useState("superadmin@example.com")
  const [password, setPassword] = useState("1234")
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const search = useSearchParams()

  const nextPath = (() => {
    const next = search.get("next")
    if (!next || !next.startsWith("/")) return "/admin/orders"
    // กัน open redirect (ยอมรับเฉพาะ path ภายใน)
    return next
  })()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return // กันกดรัว
    setErrorMsg("")
    setSubmitting(true)

    try {
      await login(email.trim(), password)
      router.replace(nextPath)
    } catch (err: unknown) {
      // แสดงข้อความจาก backend ถ้ามี (เช่น INVALID_CREDENTIALS)
      const msg =
        (isAxiosError(err) &&
          (err.response?.data as { error?: string })?.error) ||
        (err instanceof Error ? err.message : "Login failed")
      setErrorMsg(humanizeError(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-3 rounded-xl border p-6 shadow-sm bg-white"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>

        <label className="block">
          <span className="text-sm text-gray-700">Email</span>
          <input
            className="mt-1 border p-2 w-full rounded outline-none focus:ring focus:ring-black/10"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Password</span>
          <input
            className="mt-1 border p-2 w-full rounded outline-none focus:ring focus:ring-black/10"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          aria-busy={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-gray-500">
          You’ll be redirected to{" "}
          <span className="font-medium">{nextPath}</span>.
        </p>
      </form>
    </main>
  )
}

function isAxiosError(e: unknown): e is {
  isAxiosError: boolean
  response?: { data?: unknown }
} {
  return typeof e === "object" && e !== null && "isAxiosError" in e
}

function humanizeError(codeOrMsg: string): string {
  switch (codeOrMsg) {
    case "EMAIL_PASSWORD_REQUIRED":
      return "Please enter email and password."
    case "INVALID_CREDENTIALS":
      return "Email or password is incorrect."
    case "ACCOUNT_SUSPENDED":
      return "Your account is suspended. Contact administrator."
    default:
      return "Login failed. Please try again."
  }
}
