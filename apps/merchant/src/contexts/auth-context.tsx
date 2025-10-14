"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { UserAuth, AuthContextType, StoreStatus } from "../types/props/userProp"
import {
  fetchUser,
  fetchStoreStatus,
  loginUser,
  logoutUser
} from "../utils/requestUtils/requestAuthUtils"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// เส้นทางที่ไม่ควรโดนเตะกลับ (อนุญาตให้เข้าดูได้แม้ร้านยังไม่ approved)
const PUBLIC_PATHS = ["/login", "/register", "/store-status"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAuth | null>(null)
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const pathname = usePathname()
  const router = useRouter()

  // โหลด user + storeStatus ทุกครั้งที่เปลี่ยนหน้า (กันกรณี login/logout หรือเปิดแท็บใหม่)
  useEffect(() => {
    let cancelled = false

    async function loadUserAndStore() {
      setIsLoading(true)
      const currentUser = await fetchUser()

      if (cancelled) return

      setUser(currentUser)

      // ถ้าไม่ได้ล็อกอิน ก็ไม่ต้องเช็คสถานะร้าน
      if (!currentUser) {
        setStoreStatus(null)
        setIsLoading(false)
        return
      }

      // ดึงสถานะร้าน
      const status = await fetchStoreStatus()
      if (cancelled) return
      setStoreStatus(status)

      // ถ้าไม่ APPROVED และไม่ใช่หน้าที่อนุญาต -> redirect ไปหน้าแจ้งสถานะ
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
      if (status && status !== "APPROVED" && !isPublic) {
        router.replace(`/store-status?status=${status}`)
      }

      setIsLoading(false)
    }

    loadUserAndStore()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    const loggedInUser = await loginUser(email, password)

    if (loggedInUser) {
      setUser(loggedInUser)

      // หลังล็อกอินเช็คสถานะร้านทันที
      const status = await fetchStoreStatus()
      setStoreStatus(status)

      // ถ้าไม่ approved ให้เด้งไปหน้าแจ้งเตือน
      if (status && status !== "APPROVED") {
        setIsLoading(false)
        router.replace(`/store-status?status=${status}`)
        return true
      }

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
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, storeStatus }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
