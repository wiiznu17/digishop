"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import PasswordRulesForm from "@/components/auth/PasswordRulesForm"
import { acceptInvite } from "@/utils/requesters/credentialRequester"

export default function SetPasswordPage() {
  const sp = useSearchParams()
  const token = sp.get("token") || ""
  const email = sp.get("email") || ""
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!token) setErr("Missing token. Please use the link from your email.")
  }, [token])

  async function handleSubmit({
    password,
    name
  }: {
    password: string
    name?: string
  }) {
    setErr(null)
    if (!token) {
      setErr("Missing token.")
      return
    }
    setSubmitting(true)
    try {
      await acceptInvite({ token, name, password })
      router.push("/login?msg=account_ready")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e)
      setErr(e?.response?.data?.error ?? "Failed to set password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordRulesForm
            onSubmit={handleSubmit}
            showNameField
            emailForPII={email}
            submitting={submitting}
            externalError={err}
            submitLabel="Set password"
            title=""
          />
        </CardContent>
      </Card>
    </div>
  )
}
