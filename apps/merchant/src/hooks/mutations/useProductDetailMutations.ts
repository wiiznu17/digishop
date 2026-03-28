'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Product } from '@/types/props/productProp'
import {
  createProductDesiredRequester,
  deleteProductRequester,
  duplicateProductRequester,
  updateProductDesiredRequester,
  updateProductItemRequester,
  type DesiredPayload
} from '@/utils/requestUtils/requestProductUtils'
import { productQueryKeys } from '@/lib/react-query/keys/productKeys'
import { updateProductDetail } from '@/lib/react-query/helpers/productCache'
import { invalidateQueryGroups } from '@/lib/react-query/helpers/cacheSnapshots'
import { useToast } from '@/hooks/use-toast'

export function useProductDetailQueryState(productUuid: string) {
  const queryClient = useQueryClient()
  return queryClient.getQueryData<Product | null>(
    productQueryKeys.detail(productUuid)
  )
}

export function useCreateProductMutation() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      payload,
      productImages,
      itemImages
    }: {
      payload: DesiredPayload
      productImages: File[]
      itemImages: File[]
    }) => {
      const result = await createProductDesiredRequester(
        payload,
        productImages,
        itemImages
      )
      if (!result?.uuid) throw new Error('Create failed')
      return result
    },
    onSuccess: () => {
      toast({ title: 'Created' })
    },
    onError: () => {
      toast({ title: 'Error while creating', variant: 'destructive' })
    }
  })
}

export function useUpdateProductDesiredMutation(productUuid: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      payload,
      productImages,
      itemImages
    }: {
      payload: DesiredPayload
      productImages: File[]
      itemImages: File[]
    }) => {
      const result = await updateProductDesiredRequester(
        productUuid,
        payload,
        productImages,
        itemImages
      )
      if (!result?.uuid) throw new Error('Save failed')
      return result
    },
    onSuccess: (result) => {
      queryClient.setQueryData(productQueryKeys.detail(productUuid), result)
      invalidateQueryGroups(queryClient, [productQueryKeys.lists()])
      toast({ title: 'Saved' })
    },
    onError: () => {
      toast({ title: 'Error while saving', variant: 'destructive' })
    }
  })
}

export function useDeleteProductDetailMutation(productUuid: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const ok = await deleteProductRequester(productUuid)
      if (!ok) throw new Error('Delete failed')
      return productUuid
    },
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: productQueryKeys.detail(productUuid)
      })
      invalidateQueryGroups(queryClient, [productQueryKeys.lists()])
      toast({ title: 'Product deleted' })
    },
    onError: () => {
      toast({ title: 'Failed to delete product', variant: 'destructive' })
    }
  })
}

export function useDuplicateProductMutation() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (productUuid: string) => {
      const result = await duplicateProductRequester(productUuid)
      if (!result?.uuid) throw new Error('Duplicate failed')
      return result
    },
    onError: () => {
      toast({ title: 'Failed to duplicate product', variant: 'destructive' })
    }
  })
}

export function useToggleProductItemMutation(productUuid: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      itemUuid,
      next
    }: {
      itemUuid: string
      next: boolean
    }) => {
      const result = await updateProductItemRequester(productUuid, itemUuid, {
        isEnable: next
      })
      if (!result) throw new Error('Update failed')
      return { itemUuid, next }
    },
    onMutate: async ({ itemUuid, next }) => {
      const previous = queryClient.getQueryData<Product | null>(
        productQueryKeys.detail(productUuid)
      )
      updateProductDetail(queryClient, productUuid, (current) => ({
        ...current,
        items: (current.items ?? []).map((item) =>
          item.uuid === itemUuid ? { ...item, isEnable: next } : item
        )
      }))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(
        productQueryKeys.detail(productUuid),
        context?.previous
      )
      toast({
        title: 'Failed to update enable status',
        variant: 'destructive'
      })
    },
    onSettled: () => {
      invalidateQueryGroups(queryClient, [
        productQueryKeys.detail(productUuid),
        productQueryKeys.lists()
      ])
    }
  })
}
