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

const MERCHANT_HOME = "/orders"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isLoginPath(p: string) {
  return p.startsWith("/login")
}
function isRegisterPath(p: string) {
  return p.startsWith("/register")
}
function isStoreStatusPath(p: string) {
  return p.startsWith("/store-status")
}

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

  function goToMerchantHome() {
    router.replace(MERCHANT_HOME)
  }
  function goToStoreStatus(status: StoreStatus | null) {
    router.replace(`/store-status?status=${status ?? "PENDING"}`)
  }

  async function loadUserIfNeeded(): Promise<UserAuth | null> {
    const u = await fetchUser()
    setUser(u ?? null)
    return u ?? null
  }
  async function loadStoreStatusIfNeeded(): Promise<StoreStatus | null> {
    const s = await fetchStoreStatus()
    setStoreStatus(s ?? null)
    return s ?? null
  }

  async function routeAccordingToRules(currentPath: string) {
    const mySeq = ++seqRef.current
    activeRef.current = mySeq
    setIsLoading(true)

    try {
      if (isLoginPath(currentPath)) {
        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          // ไม่มี session ⇒ อยู่หน้า login ได้
          return
        }
        if (u.role === "CUSTOMER") {
          router.replace("/register")
          return
        }
        const s = await loadStoreStatusIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (s && s !== "APPROVED") {
          goToStoreStatus(s)
          return
        }
        goToMerchantHome()
        return
      }

      if (isRegisterPath(currentPath)) {
        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          router.replace("/login")
          return
        }
        if (u.role === "CUSTOMER") {
          return // ok อยู่หน้า register ได้
        }
        const s = await loadStoreStatusIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (s && s !== "APPROVED") {
          goToStoreStatus(s)
          return
        }
        goToMerchantHome()
        return
      }

      if (isStoreStatusPath(currentPath)) {
        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          router.replace("/login")
          return
        }
        if (u.role === "CUSTOMER") {
          router.replace("/register")
          return
        }
        const s = await loadStoreStatusIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (s && s !== "APPROVED") {
          return // ok อยู่หน้า store-status ได้
        }
        goToMerchantHome()
        return
      }

      // หน้าอื่นๆ (private merchant): ต้อง MERCHANT + APPROVED
      const u = await loadUserIfNeeded()
      if (activeRef.current !== mySeq || !mountedRef.current) return
      if (!u) {
        router.replace("/login")
        return
      }
      if (u.role === "CUSTOMER") {
        router.replace("/register")
        return
      }
      const s = await loadStoreStatusIfNeeded()
      if (activeRef.current !== mySeq || !mountedRef.current) return
      if (s && s !== "APPROVED") {
        goToStoreStatus(s)
        return
      }
      return
    } finally {
      if (activeRef.current === mySeq && mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    if (!inflightRef.current) {
      inflightRef.current = true
      routeAccordingToRules(pathname).finally(() => {
        inflightRef.current = false
      })
    }
    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    const loggedInUser = await loginUser(email, password)
    if (loggedInUser) {
      setUser(loggedInUser)
      setIsLoading(false)
      // ให้ routing effect จัดการ redirect ตาม path ปัจจุบัน
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
