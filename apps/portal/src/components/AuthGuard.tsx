// apps/portal/src/components/AuthGuard.tsx
"use client"

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchAuth } from "@/utils/requesters/authRequester"
import { subscribe, getAccessToken } from "@/lib/tokenStore"

export type Me = {
  id: number
  email: string
  roles: string[]
  permissions: string[]
}

export function useAuth() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setErr] = useState<Error | null>(null)

  // refs สำหรับควบคุมลำดับ/สถานะที่ไม่ทำให้ re-render
  const didRunRef = useRef(false)
  const seqRef = useRef(0)
  const activeRef = useRef(0)
  const mountedRef = useRef(true) // track ว่ายัง mounted อยู่

  async function loadMe() {
    const token = getAccessToken()
    console.log("Get token in auth guard: ", token)
    if (token == null) {
      console.log("token is null")
      // ไม่มี token → เคลียร์ state
      if (mountedRef.current) {
        setMe(null)
        setErr(null)
        setLoading(false)
      }
      return
    }

    const mySeq = ++seqRef.current
    activeRef.current = mySeq

    if (mountedRef.current) {
      setLoading(true)
      setErr(null)
    }

    try {
      const m = await fetchAuth()
      if (activeRef.current !== mySeq || !mountedRef.current) return // ทิ้งผลเก่า
      setMe(m)
    } catch (e: unknown) {
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setErr(e instanceof Error ? e : new Error("fetchAuth failed"))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true

    // dev: ให้รันครั้งเดียวต่อ component instance
    if (process.env.NODE_ENV !== "production") {
      if (!didRunRef.current) {
        didRunRef.current = true
        void loadMe()
      }
    } else {
      void loadMe()
    }

    // เมื่อ token เปลี่ยน → reload me
    const unsub = subscribe(() => {
      void loadMe()
    })

    return () => {
      mountedRef.current = false
      unsub()
    }
  }, [])

  return { me, loading, error }
}

export function useCan(perms: string[], me: Me | null) {
  const need = perms ?? []
  return useMemo(() => {
    if (!me) return false
    if (need.length === 0) return true
    const set = new Set(me.permissions || [])
    return need.every((p) => set.has(p))
  }, [me, need.join("|")])
}

export default function AuthGuard({
  children,
  requiredPerms,
  redirectTo = "/login"
}: {
  children: ReactNode
  requiredPerms?: string[]
  redirectTo?: string
}) {
  console.log("reqire permission: ", requiredPerms)
  const { me, loading } = useAuth()
  const router = useRouter()
  const redirectedRef = useRef(false) // กัน redirect ซ้ำ
  const needPerms = useMemo(() => requiredPerms ?? [], [requiredPerms])
  const allowed = useCan(needPerms, me)

  console.log("me: ", me)
  console.log("redirectedRef: ", redirectedRef)
  console.log("needPerms: ", needPerms)
  console.log("allowed: ", allowed)
  useEffect(() => {
    if (redirectedRef.current) return

    if (loading) return

    const hasToken = !!getAccessToken()
    if (!me && hasToken) return

    if (!me && !hasToken) {
      console.log("!me && !hasToken")
      redirectedRef.current = true
      router.replace(redirectTo)
      return
    }

    if (me && !allowed) {
      redirectedRef.current = true
      router.replace("/403")
      return
    }
  }, [loading, me, allowed, router, redirectTo])

  if (loading)
    return <div className="p-6 text-sm opacity-70">Checking session…</div>
  if (!me || !allowed) return null

  return <>{children}</>
}
