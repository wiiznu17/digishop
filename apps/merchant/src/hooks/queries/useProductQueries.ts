'use client'

import { useQuery } from '@tanstack/react-query'
import type { Product, ProductListItem } from '@/types/props/productProp'
import type { ProductFilterState } from '@/components/product/productFilters'
import {
  fetchCategoriesRequester,
  fetchProductDetailRequester,
  fetchProductsRequester,
  fetchProductSuggestionsRequester,
  type CategoryDto,
  type FetchProductsParams,
  type ProductListResponse,
  type SuggestResponse
} from '@/utils/requestUtils/requestProductUtils'
export { productQueryKeys } from '@/lib/react-query/keys/productKeys'
import { productQueryKeys } from '@/lib/react-query/keys/productKeys'

export function toProductListParams(
  filters: ProductFilterState,
  page: number,
  pageSize: number
): FetchProductsParams {
  return {
    q: filters.q || undefined,
    categoryUuid: filters.categoryUuid,
    status: filters.status,
    reqStatus: filters.reqStatus,
    inStock: filters.stock === 'all' ? undefined : filters.stock === 'in',
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
    page,
    pageSize
  }
}

export function useProductsListQuery(params: FetchProductsParams) {
  return useQuery<ProductListResponse>({
    queryKey: productQueryKeys.list(params),
    queryFn: async () => {
      const result = await fetchProductsRequester(params)
      if (!result) {
        throw new Error('Failed to load products')
      }
      return result
    }
  })
}

export function useProductCategoriesQuery() {
  return useQuery<CategoryDto[]>({
    queryKey: productQueryKeys.categories(),
    queryFn: fetchCategoriesRequester,
    staleTime: 5 * 60_000
  })
}

export function useProductDetailQuery(productUuid: string) {
  return useQuery<Product | null>({
    queryKey: productQueryKeys.detail(productUuid),
    enabled: Boolean(productUuid),
    queryFn: async () => {
      const result = await fetchProductDetailRequester(productUuid)
      if (!result) {
        throw new Error('Failed to load product detail')
      }
      return result
    }
  })
}

export function useProductSuggestionsQuery(q: string) {
  return useQuery<SuggestResponse>({
    queryKey: productQueryKeys.suggestions(q),
    enabled: Boolean(q.trim()),
    queryFn: async () => {
      const result = await fetchProductSuggestionsRequester(q)
      return result ?? { products: [], skus: [] }
    }
  })
}

export function findSelectedProduct(
  products: ProductListItem[] | undefined,
  productUuid: string | null
) {
  if (!products || !productUuid) return null
  return products.find((product) => product.uuid === productUuid) ?? null
}
