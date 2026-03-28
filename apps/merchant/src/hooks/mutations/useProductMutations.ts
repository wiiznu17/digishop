'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProductListItem } from '@/types/props/productProp'
import { useToast } from '@/hooks/use-toast'
import {
  bulkDeleteProductsRequester,
  bulkUpdateProductStatusRequester,
  deleteProductRequester
} from '@/utils/requestUtils/requestProductUtils'
import { productQueryKeys } from '@/lib/react-query/keys/productKeys'
import {
  captureProductListsSnapshot,
  restoreProductListsSnapshot,
  updateProductLists
} from '@/lib/react-query/helpers/productCache'
import { invalidateQueryGroups } from '@/lib/react-query/helpers/cacheSnapshots'

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (productUuid: string) => {
      const ok = await deleteProductRequester(productUuid)
      if (!ok) {
        throw new Error('Delete product failed')
      }
      return productUuid
    },
    onMutate: async (productUuid) => {
      await queryClient.cancelQueries({ queryKey: productQueryKeys.all })
      const snapshot = captureProductListsSnapshot(queryClient)

      updateProductLists(queryClient, (products) =>
        products.filter((product) => product.uuid !== productUuid)
      )

      return { snapshot }
    },
    onError: (_error, _productUuid, context) => {
      restoreProductListsSnapshot(queryClient, context?.snapshot)
      toast({ title: 'Failed to delete product', variant: 'destructive' })
    },
    onSuccess: () => {
      toast({ title: 'Product deleted' })
    },
    onSettled: () => {
      invalidateQueryGroups(queryClient, [productQueryKeys.lists()])
    }
  })
}

export function useBulkUpdateProductStatusMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      productUuids,
      status
    }: {
      productUuids: string[]
      status: string
    }) => {
      const updated = await bulkUpdateProductStatusRequester(
        productUuids,
        status
      )
      if (updated == null) {
        throw new Error('Bulk update status failed')
      }
      return { productUuids, status, updated }
    },
    onMutate: async ({ productUuids, status }) => {
      await queryClient.cancelQueries({ queryKey: productQueryKeys.all })
      const snapshot = captureProductListsSnapshot(queryClient)
      const selectedSet = new Set(productUuids)

      updateProductLists(queryClient, (products) =>
        products.map((product) =>
          selectedSet.has(product.uuid)
            ? { ...product, status: status as ProductListItem['status'] }
            : product
        )
      )

      return { snapshot }
    },
    onError: (_error, _variables, context) => {
      restoreProductListsSnapshot(queryClient, context?.snapshot)
      toast({ title: 'Bulk update status failed', variant: 'destructive' })
    },
    onSuccess: ({ updated }) => {
      toast({ title: `Updated ${updated} product(s)` })
    },
    onSettled: () => {
      invalidateQueryGroups(queryClient, [productQueryKeys.lists()])
    }
  })
}

export function useBulkDeleteProductsMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (productUuids: string[]) => {
      const ok = await bulkDeleteProductsRequester(productUuids)
      if (!ok) {
        throw new Error('Bulk delete failed')
      }
      return productUuids
    },
    onMutate: async (productUuids) => {
      await queryClient.cancelQueries({ queryKey: productQueryKeys.all })
      const snapshot = captureProductListsSnapshot(queryClient)
      const selectedSet = new Set(productUuids)

      updateProductLists(queryClient, (products) =>
        products.filter((product) => !selectedSet.has(product.uuid))
      )

      return { snapshot }
    },
    onError: (_error, _productUuids, context) => {
      restoreProductListsSnapshot(queryClient, context?.snapshot)
      toast({ title: 'Bulk delete failed', variant: 'destructive' })
    },
    onSuccess: (productUuids) => {
      toast({ title: `Deleted ${productUuids.length} product(s)` })
    },
    onSettled: () => {
      invalidateQueryGroups(queryClient, [productQueryKeys.lists()])
    }
  })
}
