"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  type ReactNode
} from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  type UserAuth,
  type AuthContextType,
  type StoreStatus
} from "../types/props/userProp"
import {
  fetchUser,
  fetchStoreStatus,
  loginUser,
  logoutUser
} from "../utils/requestUtils/requestAuthUtils"

import {
  subscribe,
  getAccessToken,
  setAccessToken,
  subscribeRefresh,
  isRefreshing
} from "@/lib/tokenStore"

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PUBLIC_PATHS = ["/login", "/register", "/store-status"]
const DEBOUNCE_MS = 80
// รอ refresh ให้เสร็จก่อน redirect (ช่วยมือถือ/รีเฟรชรัว ๆ)
const REDIRECT_GRACE_MS = 600

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAuth | null>(null)
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const pathname = usePathname()
  const router = useRouter()

  const mountedRef = useRef(true)
  const inflightRef = useRef(false)
  const seqRef = useRef(0)
  const activeRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function isPublicPath(p: string) {
    return PUBLIC_PATHS.some((x) => p.startsWith(x))
  }

  async function loadUserAndStore() {
    if (inflightRef.current) return
    inflightRef.current = true

    const mySeq = ++seqRef.current
    activeRef.current = mySeq

    try {
      const at = getAccessToken()
      const isPublic = isPublicPath(pathname)

      // หน้า public: ถ้ามี access ไปหน้า orders, ถ้าไม่มีก็จบ
      if (isPublic) {
        if (at) router.replace("/orders")
        setIsLoading(false)
        return
      }

      // หน้า private:
      setIsLoading(true)

      // ไม่มี access -> ให้คำขอแรกโดน 401 แล้ว interceptor refresh เอง
      if (!at) {
        setUser(null)
        setStoreStatus(null)
        setIsLoading(false)
        return
      }

      // มี access -> ดึง me
      const currentUser = await fetchUser()
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setUser(currentUser)

      // access ใช้ไม่ได้ (เช่น revoke) -> เคลียร์ access
      if (!currentUser) {
        setAccessToken(null)
        setStoreStatus(null)
        setIsLoading(false)
        return
      }

      // ดึงสถานะร้าน
      const status = await fetchStoreStatus()
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setStoreStatus(status)

      if (status && status !== "APPROVED") {
        router.replace(`/store-status?status=${status}`)
      }
    } finally {
      if (activeRef.current === mySeq && mountedRef.current) setIsLoading(false)
      inflightRef.current = false
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void loadUserAndStore()

    const unsubToken = subscribe(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const at = getAccessToken()
        const isPublic = isPublicPath(pathname)

        if (!at && !isPublic) {
          // รอ grace ช่วงที่ interceptor อาจกำลัง refresh อยู่
          if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
          redirectTimerRef.current = setTimeout(() => {
            if (!getAccessToken() && !isRefreshing()) {
              router.replace("/login")
            }
          }, REDIRECT_GRACE_MS)
          return
        }

        void loadUserAndStore()
      }, DEBOUNCE_MS)
    })

    const unsubRefresh = subscribeRefresh(() => {
      if (isRefreshing()) {
        if (redirectTimerRef.current) {
          clearTimeout(redirectTimerRef.current)
          redirectTimerRef.current = null
        }
      } else {
        if (!getAccessToken() && !isPublicPath(pathname)) {
          router.replace("/login")
        }
      }
    })

    return () => {
      mountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
      unsubToken()
      unsubRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    const loggedInUser = await loginUser(email, password)
    if (loggedInUser) {
      setUser(loggedInUser)
      setIsLoading(false)
      return true
    }
    setIsLoading(false)
    return false
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
    setStoreStatus(null)
    router.replace("/login")
  }

  const value = useMemo<AuthContextType>(
    () => ({ user, login, logout, isLoading, storeStatus }),
    [user, isLoading, storeStatus]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
