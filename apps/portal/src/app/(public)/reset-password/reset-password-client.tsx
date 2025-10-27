"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import PasswordRulesForm from "@/components/auth/PasswordRulesForm"
import { confirmReset } from "@/utils/requesters/credentialRequester"

export default function ResetPasswordClient({
  token,
  email
}: {
  token: string
  email: string
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!token) setErr("Missing token. Please use the link from your email.")
  }, [token])

  async function handleSubmit({ password }: { password: string }) {
    setErr(null)
    if (!token) {
      setErr("Missing token.")
      return
    }
    setSubmitting(true)
    try {
      await confirmReset({ token, password })
      router.push("/login?msg=password_reset")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e)
      setErr(e?.response?.data?.error ?? "Failed to reset password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center p-6 bg-gradient-to-br from-violet-100 via-sky-100 to-fuchsia-100">
      {/* soft pastel rings */}
      <div className="pointer-events-none absolute left-[-7rem] top-[-7rem] h-72 w-72 rounded-full border-2 border-violet-300/30" />
      <div className="pointer-events-none absolute right-[-6rem] bottom-[-6rem] h-72 w-72 rounded-full border-2 border-sky-300/40" />
      <div className="pointer-events-none absolute right-[-10rem] top-[-10rem] h-96 w-96 rounded-full border-2 border-fuchsia-300/30" />

      <Card className="w-full max-w-md border border-sky-200/60 bg-white/80 backdrop-blur-md shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold text-violet-700">
            Reset your password
          </CardTitle>
          <p className="mt-1 text-sm text-sky-700/70">
            Enter a new password to access DigiShop Merchant Portal
          </p>
        </CardHeader>
        <CardContent>
          <PasswordRulesForm
            onSubmit={handleSubmit}
            showNameField={false}
            emailForPII={email}
            submitting={submitting}
            externalError={err}
            submitLabel="Reset password"
            title=""
          />
        </CardContent>
      </Card>
    </main>
  )
}
