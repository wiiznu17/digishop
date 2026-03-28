import type { StoreStatus, UserAuth } from '@/types/props/userProp'

const MERCHANT_HOME = '/orders'

function isLoginPath(pathname: string) {
  return pathname.startsWith('/login')
}

function isRegisterPath(pathname: string) {
  return pathname.startsWith('/register')
}

function isStoreStatusPath(pathname: string) {
  return pathname.startsWith('/store-status')
}

function toStoreStatusPath(status: StoreStatus | null) {
  return `/store-status?status=${status ?? 'PENDING'}`
}

export function resolveRedirectPath(
  pathname: string,
  user: UserAuth | null,
  storeStatus: StoreStatus | null
) {
  if (isLoginPath(pathname)) {
    if (!user) return null
    if (user.role === 'CUSTOMER') return '/register'
    if (storeStatus && storeStatus !== 'APPROVED') {
      return toStoreStatusPath(storeStatus)
    }
    return MERCHANT_HOME
  }

  if (isRegisterPath(pathname)) {
    if (!user) return '/login'
    if (user.role === 'CUSTOMER') return null
    if (storeStatus && storeStatus !== 'APPROVED') {
      return toStoreStatusPath(storeStatus)
    }
    return MERCHANT_HOME
  }

  if (isStoreStatusPath(pathname)) {
    if (!user) return '/login'
    if (user.role === 'CUSTOMER') return '/register'
    if (storeStatus && storeStatus !== 'APPROVED') return null
    return MERCHANT_HOME
  }

  if (!user) return '/login'
  if (user.role === 'CUSTOMER') return '/register'
  if (storeStatus && storeStatus !== 'APPROVED') {
    return toStoreStatusPath(storeStatus)
  }
  return null
}
