import { act, renderHook } from '@testing-library/react'
import {
  useDeleteBankAccountMutation,
  useSetDefaultBankAccountMutation
} from '@/hooks/mutations/useMerchantMutations'
import { merchantQueryKeys } from '@/lib/react-query/keys/merchantKeys'
import { createQueryWrapper, createTestQueryClient } from '@/test/test-utils'
import {
  deleteBankAccountRequester,
  setDefaultBankAccountRequester
} from '@/utils/requestUtils/requestBankUtils'

vi.mock('@/utils/requestUtils/requestBankUtils', () => ({
  createBankAccountRequester: vi.fn(),
  deleteBankAccountRequester: vi.fn(),
  getBankAccountsRequester: vi.fn(),
  setDefaultBankAccountRequester: vi.fn()
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn()
  })
}))

function seedAccounts() {
  return [
    {
      id: 1,
      bankName: 'Kasikornbank',
      accountNumber: '1234567890',
      accountHolderName: 'A',
      isDefault: true,
      status: 'VERIFIED' as const
    },
    {
      id: 2,
      bankName: 'SCB',
      accountNumber: '1234567891',
      accountHolderName: 'B',
      isDefault: false,
      status: 'VERIFIED' as const
    }
  ]
}

describe('useMerchantMutations bank account optimistic flows', () => {
  it('rolls back optimistic bank account deletion on failure', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const accounts = seedAccounts()

    queryClient.setQueryData(merchantQueryKeys.bankAccounts(), accounts)
    vi.mocked(deleteBankAccountRequester).mockRejectedValue(
      new Error('cannot delete')
    )

    const { result } = renderHook(() => useDeleteBankAccountMutation(), {
      wrapper
    })

    await act(async () => {
      await expect(result.current.mutateAsync(2)).rejects.toThrow(
        'cannot delete'
      )
    })

    expect(queryClient.getQueryData(merchantQueryKeys.bankAccounts())).toEqual(
      accounts
    )
  })

  it('optimistically sets the default bank account', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)

    queryClient.setQueryData(merchantQueryKeys.bankAccounts(), seedAccounts())
    vi.mocked(setDefaultBankAccountRequester).mockResolvedValue(true)

    const { result } = renderHook(() => useSetDefaultBankAccountMutation(), {
      wrapper
    })

    await act(async () => {
      await result.current.mutateAsync(2)
    })

    expect(
      queryClient.getQueryData<Array<{ id: number; isDefault: boolean }>>(
        merchantQueryKeys.bankAccounts()
      )
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, isDefault: false }),
        expect.objectContaining({ id: 2, isDefault: true })
      ])
    )
  })
})
