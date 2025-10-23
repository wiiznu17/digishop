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
import { tryRefreshOnce } from "@/lib/axios"

const MERCHANT_HOME = "/orders" // หน้าโฮมของร้าน

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

  // guards กันยิงซ้ำ / race
  const mountedRef = useRef(true)
  const inflightRef = useRef(false)
  const seqRef = useRef(0)
  const activeRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const DEBOUNCE_MS = 80

  async function ensureAccessToken(): Promise<string | null> {
    let at = getAccessToken()
    if (!at) {
      const maybeNew = await tryRefreshOnce()
      if (maybeNew) at = maybeNew
    }
    return at || null
  }

  function goToMerchantHome() {
    router.replace(MERCHANT_HOME)
  }

  function goToStoreStatus(status: StoreStatus | null) {
    const s = status ?? "PENDING"
    router.replace(`/store-status?status=${s}`)
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
    // เพิ่ม seq กัน race
    const mySeq = ++seqRef.current
    activeRef.current = mySeq

    try {
      setIsLoading(true)

      // 1) กรณี /login — อนุญาตคนไม่มี access เข้ามา
      if (isLoginPath(currentPath)) {
        // ถ้ามี access แล้ว → ตัดสินใจตาม role
        const at = await ensureAccessToken()
        if (!at) {
          // ไม่มี access ⇒ อยู่หน้า login ได้
          return
        }

        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          // access ใช้ไม่ได้ ⇒ เคลียร์ทิ้ง ปล่อยอยู่หน้า login
          setAccessToken(null)
          return
        }

        if (u.role === "CUSTOMER") {
          router.replace("/register")
          return
        }

        // MERCHANT
        const s = await loadStoreStatusIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (s && s !== "APPROVED") {
          goToStoreStatus(s)
          return
        }
        goToMerchantHome()
        return
      }

      // 2) กรณี /register — ต้องล็อกอินแล้ว + role=CUSTOMER
      if (isRegisterPath(currentPath)) {
        const at = await ensureAccessToken()
        if (!at) {
          router.replace("/login")
          return
        }

        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          setAccessToken(null)
          router.replace("/login")
          return
        }

        if (u.role === "CUSTOMER") {
          // เงื่อนไขตรง ⇒ อยู่หน้า register ได้
          return
        }

        // MERCHANT ⇒ พาไปตามสถานะร้าน
        const s = await loadStoreStatusIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (s && s !== "APPROVED") {
          goToStoreStatus(s)
          return
        }
        goToMerchantHome()
        return
      }

      // 3) กรณี /store-status — ต้องล็อกอิน + MERCHANT ที่ยังไม่ approved
      if (isStoreStatusPath(currentPath)) {
        const at = await ensureAccessToken()
        if (!at) {
          router.replace("/login")
          return
        }

        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          setAccessToken(null)
          router.replace("/login")
          return
        }

        if (u.role === "CUSTOMER") {
          router.replace("/register")
          return
        }

        // MERCHANT ⇒ เช็คสถานะจริง
        const s = await loadStoreStatusIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (s && s !== "APPROVED") {
          // เงื่อนไขตรง ⇒ อยู่หน้า store-status ได้
          return
        }
        // approved แล้ว ⇒ ไปหน้าโฮม
        goToMerchantHome()
        return
      }

      // 4) หน้าอื่นๆ (private merchant): ต้อง MERCHANT + APPROVED
      {
        const at = await ensureAccessToken()
        if (!at) {
          router.replace("/login")
          return
        }

        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          setAccessToken(null)
          router.replace("/login")
          return
        }

        if (u.role === "CUSTOMER") {
          router.replace("/register")
          return
        }

        // MERCHANT ⇒ ต้อง approved
        const s = await loadStoreStatusIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (s && s !== "APPROVED") {
          goToStoreStatus(s)
          return
        }
        // approved ⇒ อยู่หน้าปัจจุบันได้
        return
      }
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

    // เมื่อ access token เปลี่ยน:
    // - ถ้าเป็น null และเราอยู่หน้า private => เด้ง /login
    // - ถ้ามีค่า => ประมวลผล routing ใหม่ตามกฎ
    const unsub = subscribe(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (!inflightRef.current) {
          inflightRef.current = true
          routeAccordingToRules(pathname).finally(() => {
            inflightRef.current = false
          })
        }
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
