import type { QueryClient } from '@tanstack/react-query'
import type { Product, ProductListItem } from '@/types/props/productProp'
import type { ProductListResponse } from '@/utils/requestUtils/requestProductUtils'
import { productQueryKeys } from '@/lib/react-query/keys/productKeys'
import {
  captureQueriesSnapshot,
  restoreQueriesSnapshot
} from '@/lib/react-query/helpers/cacheSnapshots'

export type ProductListSnapshot = ReturnType<typeof captureProductListsSnapshot>

export function captureProductListsSnapshot(queryClient: QueryClient) {
  return captureQueriesSnapshot<ProductListResponse>(
    queryClient,
    productQueryKeys.lists()
  )
}

export function restoreProductListsSnapshot(
  queryClient: QueryClient,
  snapshot?: ProductListSnapshot
) {
  restoreQueriesSnapshot(queryClient, snapshot)
}

export function updateProductLists(
  queryClient: QueryClient,
  updater: (products: ProductListItem[]) => ProductListItem[]
) {
  const entries = queryClient.getQueriesData<ProductListResponse>({
    queryKey: productQueryKeys.lists()
  })

  entries.forEach(([queryKey, value]) => {
    if (!value) return

    const nextData = updater(value.data)
    const removedCount = value.data.length - nextData.length

    queryClient.setQueryData<ProductListResponse>(queryKey, {
      ...value,
      data: nextData,
      meta: {
        ...value.meta,
        total: Math.max(0, value.meta.total - Math.max(0, removedCount))
      }
    })
  })
}

export function reconcileProductListsFromDetail(
  queryClient: QueryClient,
  product: Product
) {
  updateProductLists(queryClient, (products) =>
    products.map((current) => {
      if (current.uuid !== product.uuid) return current

      const enabledItems = (product.items ?? []).filter((item) => item.isEnable)

      return {
        ...current,
        name: product.name,
        description: product.description ?? current.description ?? null,
        category: product.category ?? current.category ?? null,
        status: product.status,
        reqStatus: product.reqStatus,
        minPriceMinor:
          product.minPriceMinor ??
          (enabledItems.length > 0
            ? Math.min(...enabledItems.map((item) => item.priceMinor))
            : (current.minPriceMinor ?? null)),
        totalStock:
          product.totalStock ??
          (product.items
            ? product.items.reduce(
                (sum, item) => sum + Math.max(0, item.stockQuantity ?? 0),
                0
              )
            : (current.totalStock ?? null)),
        updatedAt: product.updatedAt ?? current.updatedAt,
        createdAt: product.createdAt ?? current.createdAt
      }
    })
  )
}

export function updateProductDetail(
  queryClient: QueryClient,
  productUuid: string,
  updater: (product: Product) => Product
) {
  queryClient.setQueryData<Product | null>(
    productQueryKeys.detail(productUuid),
    (current) => (current ? updater(current) : current)
  )
}
