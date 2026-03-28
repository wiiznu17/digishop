'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MerchantHeader } from '@/components/dashboard-header'
import { Order, OrderStatus } from '@/types/props/orderProp'
import { OrderDetailDialog } from '@/components/order/order-detail-dialog'
import { OrdersTable } from '@/components/order/orders-table'
import { OrderStats } from '@/components/order/order-stats'
import { useOrderStatus } from '@/hooks/useOrderStatus'
import { useToast } from '@/hooks/use-toast'
import { OrdersFilters } from '@/components/order/orders-filters'
import { extractErrorMessage } from '@/utils/errorToToast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  applyOrdersDraftFilters,
  applyOrdersFilters,
  closeOrderDetail,
  openOrderDetail,
  resetOrdersFilters,
  setOrdersDraftFilters,
  setOrdersPage,
  setOrdersPageSize
} from '@/store/slices/ordersSlice'
import {
  toOrderListParams,
  useOrderDetailQuery,
  useOrdersListQuery,
  useOrderSummaryQuery
} from '@/hooks/queries/useOrderQueries'
import {
  useHandOverOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderTrackingMutation
} from '@/hooks/mutations/useOrderMutations'

export default function OrdersPage() {
  const dispatch = useAppDispatch()
  const {
    draftFilters,
    appliedFilters,
    page,
    pageSize,
    selectedOrderId,
    isDetailOpen
  } = useAppSelector((state) => state.orders)

  const { getStatusIcon, getStatusBadgeColor, getStatusText } = useOrderStatus()
  const { toast } = useToast()
  const listErrorSignatureRef = useRef<string | null>(null)
  const summaryErrorSignatureRef = useRef<string | null>(null)

  const listParams = useMemo(
    () => toOrderListParams(appliedFilters, page, pageSize),
    [appliedFilters, page, pageSize]
  )

  const ordersQuery = useOrdersListQuery(listParams)
  const summaryQuery = useOrderSummaryQuery()

  const selectedOrderFromList = useMemo(
    () =>
      ordersQuery.data?.data.find((order) => order.id === selectedOrderId) ??
      null,
    [ordersQuery.data?.data, selectedOrderId]
  )

  const orderDetailQuery = useOrderDetailQuery(
    selectedOrderId,
    isDetailOpen,
    selectedOrderFromList
  )

  const updateStatusMutation = useUpdateOrderStatusMutation()
  const updateTrackingMutation = useUpdateOrderTrackingMutation()
  const handOverMutation = useHandOverOrderMutation()

  useEffect(() => {
    if (!ordersQuery.error) {
      listErrorSignatureRef.current = null
      return
    }

    const parsed = extractErrorMessage(ordersQuery.error)
    const signature = JSON.stringify(parsed)
    if (listErrorSignatureRef.current === signature) return

    listErrorSignatureRef.current = signature
    toast({
      title: 'Failed to load orders',
      description: parsed.description,
      variant: 'destructive'
    })
  }, [ordersQuery.error, toast])

  useEffect(() => {
    if (!summaryQuery.error) {
      summaryErrorSignatureRef.current = null
      return
    }

    const parsed = extractErrorMessage(summaryQuery.error)
    const signature = JSON.stringify(parsed)
    if (summaryErrorSignatureRef.current === signature) return

    summaryErrorSignatureRef.current = signature
    toast({
      title: `Failed to load summary · ${parsed.title}`,
      description: parsed.description,
      variant: 'destructive'
    })
  }, [summaryQuery.error, toast])

  const handleStatClick = (payload: { statuses?: string[] }) => {
    dispatch(
      applyOrdersFilters({
        ...draftFilters,
        statuses: payload.statuses ?? []
      })
    )
  }

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    await updateStatusMutation.mutateAsync({ orderId, newStatus })
  }

  const handleTrackingNumberUpdate = async (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    await updateTrackingMutation.mutateAsync({
      orderId,
      trackingNumber,
      carrier
    })
  }

  const handleHandedOver = async (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    await handOverMutation.mutateAsync({
      orderId,
      trackingNumber,
      carrier
    })
  }

  const viewOrderDetails = (order: Order) => {
    dispatch(openOrderDetail(order.id))
  }

  const orders = ordersQuery.data?.data ?? []
  const total = ordersQuery.data?.meta.total ?? 0
  const selectedOrder = orderDetailQuery.data?.data ?? selectedOrderFromList

  return (
    <div>
      <MerchantHeader
        title="Order Management"
        description="Track and manage customer orders"
      />

      <div className="flex flex-1 flex-col gap-6 p-4">
        <OrderStats
          summary={summaryQuery.data ?? null}
          loading={summaryQuery.isLoading}
          onStatClick={handleStatClick}
        />

        <OrdersFilters
          value={draftFilters}
          onChange={(patch) => dispatch(setOrdersDraftFilters(patch))}
          onApply={() => dispatch(applyOrdersDraftFilters())}
          onReset={() => dispatch(resetOrdersFilters())}
        />

        <OrdersTable
          orders={orders}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(nextPage) => dispatch(setOrdersPage(nextPage))}
          onPageSizeChange={(nextPageSize) =>
            dispatch(setOrdersPageSize(nextPageSize))
          }
          loading={ordersQuery.isLoading || ordersQuery.isFetching}
          onViewDetails={viewOrderDetails}
          getStatusIcon={getStatusIcon}
          getStatusBadgeColor={getStatusBadgeColor}
          getStatusText={getStatusText}
        />
      </div>

      <OrderDetailDialog
        order={selectedOrder}
        isOpen={isDetailOpen}
        loading={orderDetailQuery.isLoading || orderDetailQuery.isFetching}
        onClose={() => dispatch(closeOrderDetail())}
        onStatusChange={handleStatusChange}
        onTrackingNumberUpdate={handleTrackingNumberUpdate}
        onHandedOver={handleHandedOver}
      />
    </div>
  )
}
