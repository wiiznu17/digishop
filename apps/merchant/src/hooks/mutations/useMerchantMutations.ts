'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createBankAccountRequester,
  deleteBankAccountRequester,
  setDefaultBankAccountRequester,
  type CreateBankAccountRequest
} from '@/utils/requestUtils/requestBankUtils'
import {
  updateMerchantAddressRequester,
  updateMerchantProfileRequester
} from '@/utils/requestUtils/requestProfileUtils'
import type {
  MerchantAddressForm,
  MerchantProfileFormValues
} from '@/types/props/userProp'
import { merchantQueryKeys } from '@/lib/react-query/keys/merchantKeys'
import {
  captureBankAccountsSnapshot,
  restoreBankAccountsSnapshot,
  updateBankAccounts
} from '@/lib/react-query/helpers/merchantCache'
import { invalidateQueryGroups } from '@/lib/react-query/helpers/cacheSnapshots'
import { useToast } from '@/hooks/use-toast'

export function useUpdateMerchantProfileMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      profileData,
      images
    }: {
      profileData: MerchantProfileFormValues
      images: File[]
    }) => {
      const result = await updateMerchantProfileRequester(profileData, images)
      if (!result) throw new Error('Failed to update profile')
      return result
    },
    onSuccess: () => {
      invalidateQueryGroups(queryClient, [merchantQueryKeys.profile()])
      toast({ title: 'Profile updated successfully' })
    },
    onError: () => {
      toast({ title: 'Error saving profile', variant: 'destructive' })
    }
  })
}

export function useUpdateMerchantAddressMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      addressId,
      payload
    }: {
      addressId: number
      payload: Partial<MerchantAddressForm>
    }) => updateMerchantAddressRequester(addressId, payload),
    onSuccess: () => {
      invalidateQueryGroups(queryClient, [merchantQueryKeys.profile()])
      toast({ title: 'Address updated successfully' })
    },
    onError: () => {
      toast({ title: 'Update address failed', variant: 'destructive' })
    }
  })
}

export function useCreateBankAccountMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (payload: CreateBankAccountRequest) => {
      const result = await createBankAccountRequester(payload)
      if (!result) throw new Error('Failed to add bank account')
      return result
    },
    onSuccess: () => {
      invalidateQueryGroups(queryClient, [merchantQueryKeys.bankAccounts()])
      toast({
        title: 'Success',
        description: 'Bank account added successfully'
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add bank account',
        variant: 'destructive'
      })
    }
  })
}

export function useDeleteBankAccountMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (accountId: number) => {
      const ok = await deleteBankAccountRequester(accountId)
      if (!ok) throw new Error('Failed to remove bank account')
      return accountId
    },
    onMutate: async (accountId) => {
      await queryClient.cancelQueries({
        queryKey: merchantQueryKeys.bankAccounts()
      })
      const previous = captureBankAccountsSnapshot(queryClient)
      updateBankAccounts(queryClient, (accounts) =>
        accounts.filter((account) => account.id !== accountId)
      )
      return { previous }
    },
    onError: (_error, _accountId, context) => {
      restoreBankAccountsSnapshot(queryClient, context?.previous)
      toast({
        title: 'Error',
        description: 'Failed to remove bank account',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Bank account removed successfully'
      })
    },
    onSettled: () => {
      invalidateQueryGroups(queryClient, [merchantQueryKeys.bankAccounts()])
    }
  })
}

export function useSetDefaultBankAccountMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (accountId: number) => {
      const ok = await setDefaultBankAccountRequester(accountId)
      if (!ok) throw new Error('Failed to set default bank account')
      return accountId
    },
    onMutate: async (accountId) => {
      await queryClient.cancelQueries({
        queryKey: merchantQueryKeys.bankAccounts()
      })
      const previous = captureBankAccountsSnapshot(queryClient)
      updateBankAccounts(queryClient, (accounts) =>
        accounts.map((account) => ({
          ...account,
          isDefault: account.id === accountId
        }))
      )
      return { previous }
    },
    onError: (_error, _accountId, context) => {
      restoreBankAccountsSnapshot(queryClient, context?.previous)
      toast({
        title: 'Error',
        description: 'Failed to set default bank account',
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Default bank account updated successfully'
      })
    },
    onSettled: () => {
      invalidateQueryGroups(queryClient, [merchantQueryKeys.bankAccounts()])
    }
  })
}
