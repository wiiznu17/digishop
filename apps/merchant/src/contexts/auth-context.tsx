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

import { subscribe, getAccessToken, setAccessToken } from "@/lib/tokenStore"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// หน้า public ที่เข้าดูได้แม้ยังไม่ approved
const PUBLIC_PATHS = ["/login", "/register", "/store-status"]
const DEBOUNCE_MS = 80

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAuth | null>(null)
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const pathname = usePathname()
  const router = useRouter()

  // guards กันยิงซ้ำ
  const mountedRef = useRef(true)
  const inflightRef = useRef(false)
  const seqRef = useRef(0)
  const activeRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

      // หน้า public: ถ้ามี access → เด้งเข้าหน้าหลัก, ถ้าไม่มี → ไม่ทำอะไร
      if (isPublic) {
        if (at) router.replace("/orders")
        setIsLoading(false)
        return
      }

      // หน้า private:
      setIsLoading(true)

      // ไม่มี access ตอนแรก → ปล่อยให้รีเควสต์จริงโดน 401 แล้ว interceptor ไป refresh ให้เอง
      if (!at) {
        setUser(null)
        setStoreStatus(null)
        setIsLoading(false)
        return
      }

      // มี access แล้ว → โหลด me
      const currentUser = await fetchUser()
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setUser(currentUser)

      // ถ้า access ใช้ไม่ได้ (เช่นโดน revoke) → เคลียร์ & ให้ interceptor เป็นคน refresh ตอนยิง API
      if (!currentUser) {
        setAccessToken(null)
        setStoreStatus(null)
        setIsLoading(false)
        return
      }

      // โหลดสถานะร้าน
      const status = await fetchStoreStatus()
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setStoreStatus(status)

      if (status && status !== "APPROVED") {
        router.replace(`/store-status?status=${status}`)
      }
    } finally {
      if (activeRef.current === mySeq && mountedRef.current) {
        setIsLoading(false)
      }
      inflightRef.current = false
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void loadUserAndStore()

    // เมื่อ access token เปลี่ยน:
    // - ถ้าเป็น null และเราอยู่หน้า private => แปลว่า refresh ล้มเหลว -> เด้ง login
    // - ถ้ามีค่า => โหลด me/store ใหม่
    const unsub = subscribe(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const at = getAccessToken()
        const isPublic = isPublicPath(pathname)
        if (!at && !isPublic) {
          router.replace("/login")
          return
        }
        void loadUserAndStore()
      }, DEBOUNCE_MS)
    })

    return () => {
      mountedRef.current = false
      if (debounceRef.current) clearTimeout(debounceRef.current)
      unsub()
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
