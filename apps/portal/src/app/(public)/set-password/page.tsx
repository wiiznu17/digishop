import SetPasswordClient from "./set-password-client"

// หน้านี้เป็นลิงก์จากอีเมล/โทเค็น → ไม่ควร cache
export const revalidate = 0
// หรือใช้แทนกันได้:
// export const dynamic = "force-dynamic"

export default async function SetPasswordPage({
  searchParams
}: {
  // Next.js 15: searchParams เป็น Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const get1 = (v: unknown) =>
    typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : ""

  const token = get1(sp.token)
  const email = get1(sp.email)

  return <SetPasswordClient token={token} email={email} />
}
