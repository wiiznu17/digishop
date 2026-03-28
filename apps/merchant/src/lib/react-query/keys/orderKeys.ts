import type { ListOrdersParams } from '@/utils/requestUtils/requestOrderUtils'

export const orderQueryKeys = {
  all: ['orders'] as const,
  lists: () => ['orders', 'list'] as const,
  list: (params: ListOrdersParams) => ['orders', 'list', params] as const,
  summary: () => ['orders', 'summary'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const
}
