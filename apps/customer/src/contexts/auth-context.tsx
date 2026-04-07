'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useMemo
} from 'react'
import { FormLogin, AuthContextType } from '../types/props/userProp'
import {
  fetchUser,
  loginUser,
  logoutUser
} from '../utils/requestUtils/requestLoginUtils'
import { usePathname, useRouter } from 'next/navigation'
// import { setAccessToken, getAccessToken, subscribe } from "@/lib/tokenStore"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_PATHS = ['/auth', '/product', '/search', '/store']
const CUSTOMER_HOME = '/'
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
  function goToCustomerHome() {
    router.replace(CUSTOMER_HOME)
  }
  function isPublicPath(p: string) {
    return PUBLIC_PATHS.some((x) => p.startsWith(x))
  }
  async function loadUserIfNeeded(): Promise<FormLogin | null> {
    const u = await fetchUser()
    setUser(u ?? null)
    return u ?? null
  }


  async function routeAccordingToRules(currentPath: string) {
    const mySeq = ++seqRef.current
    activeRef.current = mySeq
    setIsLoading(true)
    try {
      // if (isLoginPath(currentPath)) {
      //   const u = await loadUserIfNeeded()
      //   if (activeRef.current !== mySeq || !mountedRef.current) return
      //   if (!u) {
      //     // ไม่มี session ⇒ อยู่หน้า login ได้
      //     return
      //   }
      //   if (u.role === "CUSTOMER") {
      //     router.replace("/register")
      //     return
      //   }
      //   goToCustomerHome()
      //   return
      // }

      //ดูอีกที
      if (!isPublicPath(currentPath)) {
        const u = await loadUserIfNeeded()
        if (activeRef.current !== mySeq || !mountedRef.current) return
        if (!u) {
          router.replace('/')
          return
        }
        // if (u.role === "CUSTOMER") {
        //   router.replace("/register")
        //   return
        // }
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
    console.log('loggedInUser', loggedInUser)
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
    goToCustomerHome()
  }
  const value = useMemo<AuthContextType>(
    () => ({ user, login, logout, isLoading }),
    [user, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
