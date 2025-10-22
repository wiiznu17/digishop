"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useMemo
} from "react"
import { FormLogin, AuthContextType } from "../types/props/userProp"
import {
  fetchUser,
  loginUser,
  logoutUser
} from "../utils/requestUtils/requestLoginUtils"
import { usePathname, useRouter } from "next/navigation"
import { setAccessToken, getAccessToken, subscribe } from "@/lib/tokenStore"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

  const PUBLIC_PATHS = ["/auth","/product","/search","/store"]  
  const DEBOUNCE_MS = 80
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FormLogin | null>(null)
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
        if (at) router.replace("/")
        setIsLoading(false)
        return
      }

      // หน้า private:
      setIsLoading(true)

      // ไม่มี access ตอนแรก → ปล่อยให้รีเควสต์จริงโดน 401 แล้ว interceptor ไป refresh ให้เอง
      if (!at) {
        setUser(null)
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
        setUser(null)
        setIsLoading(false)
        return
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
          router.replace("/auth")
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
    console.log('loggedInUser',loggedInUser)
    if (loggedInUser) {
      setUser(loggedInUser)
      setIsLoading(false)
      return true
    }
    setIsLoading(false)
    return false
  }
  console.log('user',user)
  console.log('access token',getAccessToken())

  const logout = async () => {
    await logoutUser()
    setUser(null)
    setAccessToken(null)
  }
  const value = useMemo<AuthContextType>(
    () => ({ user, login, logout, isLoading,  }),
    [user, isLoading]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}