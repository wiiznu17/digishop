'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchMerchantProfileRequester } from '@/utils/requestUtils/requestProfileUtils'
import {
  fetchMerchantDashboard,
  type MerchantDashboard
} from '@/utils/requestUtils/requestDashboardUtils'
import {
  getBankAccountsRequester,
  type BankAccount
} from '@/utils/requestUtils/requestBankUtils'
import type { MerchantProfileFormValues } from '@/types/props/userProp'
export { merchantQueryKeys } from '@/lib/react-query/keys/merchantKeys'
import { merchantQueryKeys } from '@/lib/react-query/keys/merchantKeys'

export function useMerchantProfileQuery() {
  return useQuery<MerchantProfileFormValues>({
    queryKey: merchantQueryKeys.profile(),
    queryFn: async () => {
      const result = await fetchMerchantProfileRequester()
      if (!result) throw new Error('Failed to load merchant profile')
      return result
    }
  })
}

export function useMerchantDashboardQuery() {
  return useQuery<MerchantDashboard>({
    queryKey: merchantQueryKeys.dashboard(),
    queryFn: fetchMerchantDashboard
  })
}

export function useBankAccountsQuery() {
  return useQuery<BankAccount[]>({
    queryKey: merchantQueryKeys.bankAccounts(),
    queryFn: async () => {
      const result = await getBankAccountsRequester()
      if (!result) throw new Error('Failed to load bank accounts')
      return result
    }
  })
}
