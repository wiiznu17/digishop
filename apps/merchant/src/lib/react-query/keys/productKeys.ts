import type { FetchProductsParams } from '@/utils/requestUtils/requestProductUtils'

export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => ['products', 'list'] as const,
  list: (params: FetchProductsParams) => ['products', 'list', params] as const,
  detail: (productUuid: string) => ['products', 'detail', productUuid] as const,
  categories: () => ['products', 'categories'] as const,
  suggestions: (q: string) => ['products', 'suggestions', q] as const
}
