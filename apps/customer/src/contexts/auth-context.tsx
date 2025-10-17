"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react"
import { FormLogin, AuthContextType } from "../types/props/userProp"
import {
  fetchUser,
  loginUser,
  logoutUser
} from "../utils/requestUtils/requestLoginUtils"
import { usePathname } from "next/navigation"
import { setAccessToken } from "@/lib/tokenStore"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FormLogin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    async function loadUser() {
      const currentUser = await fetchUser()
      setUser(currentUser)
      setIsLoading(false)
    }
    loadUser()
  }, [pathname])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    const loggedInUser = await loginUser(email, password)
    if (loggedInUser) {
      setUser(loggedInUser)
      setIsLoading(false)
      console.log('user in login',loggedInUser)
      return true
    }
    setIsLoading(false)
    return false
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
    setAccessToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
