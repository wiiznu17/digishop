import type { QueryClient } from '@tanstack/react-query'
import type { BankAccount } from '@/utils/requestUtils/requestBankUtils'
import { merchantQueryKeys } from '@/lib/react-query/keys/merchantKeys'
import {
  captureQuerySnapshot,
  restoreQuerySnapshot
} from '@/lib/react-query/helpers/cacheSnapshots'

export type BankAccountsSnapshot = ReturnType<
  typeof captureBankAccountsSnapshot
>

export function captureBankAccountsSnapshot(queryClient: QueryClient) {
  return captureQuerySnapshot<BankAccount[]>(
    queryClient,
    merchantQueryKeys.bankAccounts()
  )
}

export function restoreBankAccountsSnapshot(
  queryClient: QueryClient,
  snapshot?: BankAccountsSnapshot
) {
  restoreQuerySnapshot(queryClient, snapshot)
}

export function updateBankAccounts(
  queryClient: QueryClient,
  updater: (accounts: BankAccount[]) => BankAccount[]
) {
  queryClient.setQueryData<BankAccount[]>(
    merchantQueryKeys.bankAccounts(),
    (current = []) => updater(current)
  )
}
