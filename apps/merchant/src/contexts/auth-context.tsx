'use client'

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { type AuthContextType } from '@/types/props/userProp'
import {
  authQueryKeys,
  useAuthUserQuery,
  useStoreStatusQuery
} from '@/hooks/queries/useAuthQueries'
import {
  loginUser,
  loginUserWithGoogle,
  logoutUser
} from '@/utils/requestUtils/requestAuthUtils'
import { resolveRedirectPath } from '@/contexts/auth-routing'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const userQuery = useAuthUserQuery()
  const user = userQuery.data ?? null
  const shouldLoadStoreStatus = Boolean(user && user.role !== 'CUSTOMER')
  const storeStatusQuery = useStoreStatusQuery(shouldLoadStoreStatus)
  const storeStatus = shouldLoadStoreStatus
    ? (storeStatusQuery.data ?? null)
    : null

  const isLoading =
    userQuery.isPending || (shouldLoadStoreStatus && storeStatusQuery.isPending)

  const redirectPath = useMemo(
    () => (isLoading ? null : resolveRedirectPath(pathname, user, storeStatus)),
    [isLoading, pathname, storeStatus, user]
  )

  useEffect(() => {
    if (!redirectPath || redirectPath === pathname) return
    router.replace(redirectPath)
  }, [pathname, redirectPath, router])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const loggedInUser = await loginUser(email, password)

      if (!loggedInUser) {
        queryClient.setQueryData(authQueryKeys.user(), null)
        queryClient.setQueryData(authQueryKeys.storeStatus(), null)
        return false
      }

      queryClient.setQueryData(authQueryKeys.user(), loggedInUser)

      if (loggedInUser.role === 'CUSTOMER') {
        queryClient.setQueryData(authQueryKeys.storeStatus(), null)
      } else {
        void queryClient.invalidateQueries({
          queryKey: authQueryKeys.storeStatus()
        })
      }

      return true
    },
    [queryClient]
  )
  const googleLogin = useCallback(
    async (idToken: string): Promise<boolean> => {
      const loggedInUser = await loginUserWithGoogle(idToken)

      if (!loggedInUser) {
        queryClient.setQueryData(authQueryKeys.user(), null)
        queryClient.setQueryData(authQueryKeys.storeStatus(), null)
        return false
      }

      queryClient.setQueryData(authQueryKeys.user(), loggedInUser)

      if (loggedInUser.role === 'CUSTOMER') {
        queryClient.setQueryData(authQueryKeys.storeStatus(), null)
      } else {
        void queryClient.invalidateQueries({
          queryKey: authQueryKeys.storeStatus()
        })
      }

      return true
    },
    [queryClient]
  )

  const logout = useCallback(async () => {
    await logoutUser()
    await queryClient.cancelQueries({ queryKey: authQueryKeys.all })
    queryClient.setQueryData(authQueryKeys.user(), null)
    queryClient.setQueryData(authQueryKeys.storeStatus(), null)
    router.replace('/login')
  }, [queryClient, router])

  const value = useMemo<AuthContextType>(
    () => ({ user, login, googleLogin, logout, isLoading, storeStatus }),
    [isLoading, login, googleLogin, logout, storeStatus, user]
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
