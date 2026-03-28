'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchStoreStatus,
  fetchUser
} from '@/utils/requestUtils/requestAuthUtils'
import { authQueryKeys } from '@/lib/react-query/keys/authKeys'
import type { StoreStatus, UserAuth } from '@/types/props/userProp'

export { authQueryKeys } from '@/lib/react-query/keys/authKeys'

export function useAuthUserQuery() {
  return useQuery<UserAuth | null>({
    queryKey: authQueryKeys.user(),
    queryFn: fetchUser,
    retry: false
  })
}

export function useStoreStatusQuery(enabled: boolean) {
  return useQuery<StoreStatus | null>({
    queryKey: authQueryKeys.storeStatus(),
    enabled,
    queryFn: fetchStoreStatus,
    retry: false
  })
}
