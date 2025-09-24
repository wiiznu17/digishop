"use client"
import { ReactNode } from "react"
import { useAuth, useCan } from "@/lib/authClient"

export function Can({
  perms,
  children
}: {
  perms: string[]
  children: ReactNode
}) {
  const { me } = useAuth()
  const ok = useCan(perms, me)
  if (!ok) return null
  return <>{children}</>
}
