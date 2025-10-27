"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { login } from "@/utils/requesters/authRequester"
import { ModeToggle } from "@/components/mode-toggle"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center p-4">
          Loading…
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const search = useSearchParams()

  const nextPath = useMemo(() => {
    const next = search.get("next")
    if (!next || !next.startsWith("/")) return "/"
    return next
  }, [search])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setErrorMsg("")
    setSubmitting(true)

    try {
      await login(email.trim(), password)
      router.replace(nextPath)
    } catch (err: unknown) {
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
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>

      {/* LEFT: Illustration / Logo */}
      <section className="relative flex items-center justify-center p-8 bg-white">
        <Image
          src="/login.svg"
          alt="DigiShop"
          width={420}
          height={420}
          priority
          className="drop-shadow-sm"
        />
      </section>

      {/* RIGHT: gradient background */}
      <section className="relative flex items-center justify-center bg-gradient-to-br from-fuchsia-100 via-sky-100 to-violet-100">
        {/* soft pastel rings */}
        {/* <div className="pointer-events-none absolute right-[-6rem] bottom-[-6rem] h-72 w-72 rounded-full border-2 border-sky-300/40" />
        <div className="pointer-events-none absolute right-[-10rem] bottom-[-10rem] h-96 w-96 rounded-full border-2 border-fuchsia-300/30" />
        <div className="pointer-events-none absolute left-[-7rem] top-[-7rem] h-80 w-80 rounded-full border-2 border-violet-300/30" /> */}

        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-5 rounded-2xl border border-sky-200/50 bg-white/80 p-6 shadow-xl backdrop-blur-md"
        >
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold text-violet-700">Login</h1>
            <p className="text-sky-700/70">Sign in to DigiShop Admin Portal</p>
          </header>

          {/* Email */}
          <label className="block">
            <span className="text-sm text-violet-900">Email Address</span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                className="w-full rounded-md border p-2 pl-9 outline-none focus:ring-2 focus:ring-sky-300/70"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="digo@thailand.com"
              />
            </div>
          </label>

          {/* Password + show/hide */}
          <label className="block">
            <span className="text-sm text-violet-900">Password</span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                className="w-full rounded-md border p-2 pl-9 pr-10 outline-none focus:ring-2 focus:ring-fuchsia-300/70"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-sky-600 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          {/* Error */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[linear-gradient(90deg,_#38bdf8,_#f472b6,_#8b5cf6)] px-3 py-2 font-medium text-white shadow-md hover:brightness-105 disabled:opacity-50"
            aria-busy={submitting}
          >
            {submitting ? "Signing in…" : "Login"}
          </button>

          {/* No extra links since admin access is by invite only */}
          <p className="pt-4 text-center text-sm text-violet-700/70 italic">
            Access is available by invitation only.
          </p>
        </form>
      </section>
    </main>
  )
}

function isAxiosError(
  e: unknown
): e is { isAxiosError: boolean; response?: { data?: unknown } } {
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
