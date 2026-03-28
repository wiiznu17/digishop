import type { QueryClient } from '@tanstack/react-query'
import type { Order, OrderStatus } from '@/types/props/orderProp'
import type { ListOrdersResponse } from '@/utils/requestUtils/requestOrderUtils'
import { orderQueryKeys } from '@/lib/react-query/keys/orderKeys'
import {
  captureQueriesSnapshot,
  captureQuerySnapshot,
  restoreQueriesSnapshot,
  restoreQuerySnapshot
} from '@/lib/react-query/helpers/cacheSnapshots'

export type OrderCacheSnapshot = {
  listEntries: ReturnType<typeof captureOrderListsSnapshot>
  detailEntry: ReturnType<typeof captureOrderDetailSnapshot>
}

export function appendOrderStatusHistory(
  order: Order,
  nextStatus: OrderStatus
) {
  const baseHistory = order.statusHistory?.length
    ? order.statusHistory
    : [order.status]
  return [...baseHistory, nextStatus]
}

export function captureOrderListsSnapshot(queryClient: QueryClient) {
  return captureQueriesSnapshot<ListOrdersResponse>(
    queryClient,
    orderQueryKeys.lists()
  )
}

export function captureOrderDetailSnapshot(
  queryClient: QueryClient,
  orderId: string
) {
  return captureQuerySnapshot<{ data: Order }>(
    queryClient,
    orderQueryKeys.detail(orderId)
  )
}

export function captureOrderCacheSnapshot(
  queryClient: QueryClient,
  orderId: string
): OrderCacheSnapshot {
  return {
    listEntries: captureOrderListsSnapshot(queryClient),
    detailEntry: captureOrderDetailSnapshot(queryClient, orderId)
  }
}

export function restoreOrderCacheSnapshot(
  queryClient: QueryClient,
  snapshot?: OrderCacheSnapshot
) {
  if (!snapshot) return
  restoreQueriesSnapshot(queryClient, snapshot.listEntries)
  restoreQuerySnapshot(queryClient, snapshot.detailEntry)
}

export function updateOrderAcrossCaches(
  queryClient: QueryClient,
  orderId: string,
  updater: (order: Order) => Order
) {
  const listEntries = queryClient.getQueriesData<ListOrdersResponse>({
    queryKey: orderQueryKeys.lists()
  })

  listEntries.forEach(([queryKey, value]) => {
    if (!value) return

    queryClient.setQueryData<ListOrdersResponse>(queryKey, {
      ...value,
      data: value.data.map((order) =>
        order.id === orderId ? updater(order) : order
      )
    })
  })

  queryClient.setQueryData<{ data: Order }>(
    orderQueryKeys.detail(orderId),
    (current) => (current ? { data: updater(current.data) } : current)
  )
}
