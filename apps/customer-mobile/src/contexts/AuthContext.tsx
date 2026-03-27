import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from '../lib/axios'

export interface AuthUser {
  id: number
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data ?? null)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        setIsLoading(true)
        const res = await axios.post(
          '/api/auth/login',
          { email, password },
          { withCredentials: true }
        )
        const userData = res.data?.user ?? null
        setUser(userData)
        if (userData?.id)
          await AsyncStorage.setItem('userId', String(userData.id))
        return !!userData
      } catch {
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch {}
    setUser(null)
    await AsyncStorage.removeItem('userId')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
