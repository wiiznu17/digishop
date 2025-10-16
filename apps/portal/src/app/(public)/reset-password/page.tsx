import { Suspense } from "react"
import ResetPasswordClient from "./reset-password-client"

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams: { token?: string; email?: string }
}) {
  const token = searchParams?.token ?? ""
  const email = searchParams?.email ?? ""

  return (
    <Suspense>
      <ResetPasswordClient token={token} email={email} />
    </Suspense>
  )
}

// ถ้าหน้านี้ต้อง dynamic เสมอ (ไม่ cache)
export const revalidate = 0
// หรือใช้บรรทัดนี้แทน:
// export const dynamic = "force-dynamic"
