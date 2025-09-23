// apps/portal/src/components/AuthGuard.tsx
"use client"

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchAuth } from "@/utils/requesters/authRequester"
import { subscribe, getAccessToken } from "@/lib/tokenStore"

// -------- Types --------
export type Me = {
  id: number
  email: string
  roles: string[]
  permissions: string[]
}

// -------- useAuth: โหลดข้อมูลผู้ใช้จาก /api/auth/access --------
// - ไม่เรียก API ถ้ายังไม่มี access token
// - กัน StrictMode และการ unmount ด้วย request-id (sequence)
export function useAuth() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setErr] = useState<Error | null>(null)

  // ใช้ useRef เพื่อเก็บ state ที่ไม่ทำให้ re-render
  const didRunRef = useRef(false)
  const seqRef = useRef(0)
  const activeRef = useRef(0)
  const mountedRef = useRef(true) // เพิ่ม: track component mount status

  async function loadMe() {
    console.log("🔄 useAuth: loadMe called")

    const token = getAccessToken()
    console.log("🔑 useAuth: token check", {
      hasToken: !!token,
      tokenLength: token?.length || 0
    })

    if (token == null) {
      console.log("❌ useAuth: No token, clearing state")
      // ไม่ต้อง update sequence ถ้าไม่มี token
      if (mountedRef.current) {
        setMe(null)
        setErr(null)
        setLoading(false)
      }
      return
    }

    const mySeq = ++seqRef.current
    activeRef.current = mySeq
    console.log(`🚀 useAuth: Starting request (seq: ${mySeq})`)

    if (mountedRef.current) {
      setLoading(true)
      setErr(null)
    }

    try {
      const m = await fetchAuth()
      console.log("✅ useAuth: fetchAuth success", m)

      // เช็คทั้ง sequence และ mounted status
      if (activeRef.current !== mySeq) {
        console.log(
          `⚠️ useAuth: Request outdated (current: ${activeRef.current}, mine: ${mySeq})`
        )
        return
      }

      if (!mountedRef.current) {
        console.log("⚠️ useAuth: Component unmounted, ignoring response")
        return
      }

      setMe(m)
    } catch (e: unknown) {
      console.error("❌ useAuth: fetchAuth failed", e)
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setErr(e instanceof Error ? e : new Error("fetchAuth failed"))
    } finally {
      if (activeRef.current === mySeq && mountedRef.current) {
        console.log(`🏁 useAuth: Setting loading=false (seq: ${mySeq})`)
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    console.log("🔧 useAuth: useEffect triggered")
    mountedRef.current = true

    // ใน development: เรียกครั้งเดียวต่อ component instance
    if (process.env.NODE_ENV !== "production") {
      if (!didRunRef.current) {
        didRunRef.current = true
        void loadMe()
      }
    } else {
      void loadMe()
    }

    const unsub = subscribe(() => {
      console.log("🔔 useAuth: Token changed, reloading")
      void loadMe()
    })

    return () => {
      console.log("🧹 useAuth: Cleanup")
      mountedRef.current = false
      unsub()
    }
  }, [])

  return { me, loading, error }
}

// -------- RBAC helper: ตรวจสิทธิ์จาก perms --------
export function useCan(perms: string[], me: Me | null) {
  const need = perms ?? []
  return useMemo(() => {
    if (!me) return false
    if (need.length === 0) return true
    const set = new Set(me.permissions || [])
    return need.every((p) => set.has(p))
  }, [me, need.join("|")])
}

// -------- AuthGuard: ครอบหน้าที่ต้องล็อกอิน/มีสิทธิ์ --------
export default function AuthGuard({
  children,
  requiredPerms,
  redirectTo = "/login"
}: {
  children: ReactNode
  requiredPerms?: string[]
  redirectTo?: string
}) {
  const { me, loading } = useAuth()
  const router = useRouter()
  const redirectedRef = useRef(false) // กัน redirect ซ้ำ

  const needPerms = useMemo(() => requiredPerms ?? [], [requiredPerms])
  const allowed = useCan(needPerms, me)

  useEffect(() => {
    if (loading || redirectedRef.current) return

    // ยังไม่ล็อกอิน
    if (!me) {
      console.log("Not login")
      redirectedRef.current = true
      router.replace(redirectTo)
      return
    }

    // ล็อกอินแล้ว แต่สิทธิ์ไม่พอ
    if (!allowed) {
      console.log("already login but Do not access")
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
