import SetPasswordClient from './set-password-client'

export const revalidate = 0

export default async function SetPasswordPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const get1 = (v: unknown) =>
    typeof v === 'string' ? v : Array.isArray(v) ? (v[0] ?? '') : ''

  const token = get1(sp.token)
  const email = get1(sp.email)

  return <SetPasswordClient token={token} email={email} />
}
