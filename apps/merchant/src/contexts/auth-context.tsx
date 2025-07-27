"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react"
import axios from "@/lib/axios"
import {
  UserAuth,
  AuthContextType,
  RegisterData
} from "../types/props/userProp"
import Cookies from "js-cookie"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAuth | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ดึง user จาก backend ตอนโหลด
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me", {
          withCredentials: true
        })
        console.log("response from /auth/me : ", res)
        setUser(res.data.user)
        console.log("User that save: ", res.data.user)
      } catch (error) {
        // Cookies.remove("token")
        console.error("Error fetching user:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      )
      console.log("response data user :", res)
      setUser(res.data.user)
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await axios.post("/api/auth/register", userData, {
        withCredentials: true
      })
      setUser(res.data.user)
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      // อาจจะลบ cookie ถ้าไม่ใช้ middleware
      // Cookies.remove("token")
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
