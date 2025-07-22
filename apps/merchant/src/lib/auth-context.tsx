"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { User, AuthContextType, RegisterData } from "./types"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem("merchant_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, accept any email/password combination
      const mockUser: User = {
        id: "1",
        email,
        businessName: "Demo Business",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        businessAddress: "123 Business St, City, State 12345",
        businessType: "Retail",
        createdAt: new Date()
      }

      setUser(mockUser)
      localStorage.setItem("merchant_user", JSON.stringify(mockUser))
      return true
    } catch (error) {
      console.error("Login failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        businessName: userData.businessName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        businessType: userData.businessType,
        createdAt: new Date()
      }

      setUser(newUser)
      localStorage.setItem("merchant_user", JSON.stringify(newUser))
      return true
    } catch (error) {
      console.error("Registration failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("merchant_user")
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
