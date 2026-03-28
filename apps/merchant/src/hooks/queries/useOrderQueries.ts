'use client'

import { useQuery } from '@tanstack/react-query'
import type { Order } from '@/types/props/orderProp'
import type { OrdersFiltersValue } from '@/components/order/orders-filters'
import {
  fetchOrderSummary,
  getOrderByIdRequester,
  listOrdersRequester,
  type ListOrdersParams,
  type ListOrdersResponse,
  type OrderSummary
} from '@/utils/requestUtils/requestOrderUtils'
export { orderQueryKeys } from '@/lib/react-query/keys/orderKeys'
import { orderQueryKeys } from '@/lib/react-query/keys/orderKeys'

export function toOrderListParams(
  filters: OrdersFiltersValue,
  page: number,
  pageSize: number
): ListOrdersParams {
  return {
    page,
    pageSize,
    q: filters.q,
    status: filters.statuses.length ? filters.statuses.join(',') : 'ALL',
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
    hasTracking: filters.hasTracking || undefined
  }
}

export function useOrdersListQuery(params: ListOrdersParams) {
  return useQuery<ListOrdersResponse>({
    queryKey: orderQueryKeys.list(params),
    queryFn: ({ signal }) => listOrdersRequester({ ...params, signal })
  })
}

export function useOrderSummaryQuery() {
  return useQuery<OrderSummary>({
    queryKey: orderQueryKeys.summary(),
    queryFn: ({ signal }) => fetchOrderSummary({ signal })
  })
}

export function useOrderDetailQuery(
  orderId: string | null,
  enabled: boolean,
  initialOrder?: Order | null
) {
  return useQuery<{ data: Order }>({
    queryKey: orderId ? orderQueryKeys.detail(orderId) : ['orders', 'detail'],
    enabled: enabled && Boolean(orderId),
    placeholderData: initialOrder ? { data: initialOrder } : undefined,
    queryFn: ({ signal }) => getOrderByIdRequester(orderId as string, signal)
  })
}
