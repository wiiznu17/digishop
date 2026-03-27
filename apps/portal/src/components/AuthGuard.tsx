'use client'

import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuth } from '@/utils/requesters/authRequester'

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

  const didRunRef = useRef(false)
  const seqRef = useRef(0)
  const activeRef = useRef(0)
  const mountedRef = useRef(true)

  async function loadMe() {
    const mySeq = ++seqRef.current
    activeRef.current = mySeq

    if (mountedRef.current) {
      setLoading(true)
      setErr(null)
    }

    try {
      const m = await fetchAuth()
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setMe(m)
    } catch (e: unknown) {
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setMe(null)
      setErr(e instanceof Error ? e : new Error('fetchAuth failed'))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    if (process.env.NODE_ENV !== 'production') {
      if (!didRunRef.current) {
        didRunRef.current = true
        void loadMe()
      }
    } else {
      void loadMe()
    }

    // รีเช็ค session เมื่อกลับมาโฟกัส/แท็บกลับมา visible
    const onFocus = () => void loadMe()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadMe()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mountedRef.current = false
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
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
  }, [me, need.join('|')])
}

export default function AuthGuard({
  children,
  requiredPerms,
  redirectTo = '/login'
}: {
  children: ReactNode
  requiredPerms?: string[]
  redirectTo?: string
}) {
  const { me, loading } = useAuth()
  const router = useRouter()
  const redirectedRef = useRef(false)
  const needPerms = useMemo(() => requiredPerms ?? [], [requiredPerms])
  const allowed = useCan(needPerms, me)

  useEffect(() => {
    if (redirectedRef.current) return
    if (loading) return

    // ไม่มี session → ไปหน้า login
    if (!me) {
      redirectedRef.current = true
      router.replace(redirectTo)
      return
    }

    // มี session แต่สิทธิ์ไม่พอ
    if (me && !allowed) {
      redirectedRef.current = true
      router.replace('/403')
      return
    }
  }, [loading, me, allowed, router, redirectTo])

  if (loading)
    return <div className="p-6 text-sm opacity-70">Checking session…</div>
  if (!me || !allowed) return null
  return <>{children}</>
}
