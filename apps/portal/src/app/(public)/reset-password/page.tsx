import ResetPasswordClient from "./reset-password-client"

export const revalidate = 0 // หรือใช้ export const dynamic = "force-dynamic"

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const token =
    typeof sp.token === "string"
      ? sp.token
      : Array.isArray(sp.token)
        ? (sp.token[0] ?? "")
        : ""

  const email =
    typeof sp.email === "string"
      ? sp.email
      : Array.isArray(sp.email)
        ? (sp.email[0] ?? "")
        : ""

  return <ResetPasswordClient token={token} email={email} />
}
