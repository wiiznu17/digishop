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
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
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
    </div>
  )
}
