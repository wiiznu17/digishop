'use client'

import { useEffect, useRef, useState } from 'react'
import { MerchantHeader } from '@/components/dashboard-header'
import { Order, OrderStatus } from '@/types/props/orderProp'
import { OrderDetailDialog } from '@/components/order/order-detail-dialog'
import { OrdersTable } from '@/components/order/orders-table'
import { OrderStats } from '@/components/order/order-stats'
import { useOrderStatus } from '@/hooks/useOrderStatus'
import {
  listOrdersRequester,
  updateOrderRequester,
  handOverOrderRequester,
  type ListOrdersParams as _ListOrdersParams,
  type ListOrdersResponse as _ListOrdersResponse,
  OrderSummary,
  fetchOrderSummary
} from '@/utils/requestUtils/requestOrderUtils'
import { useToast } from '@/hooks/use-toast'
import {
  OrdersFilters,
  OrdersFiltersValue
} from '@/components/order/orders-filters'
import { extractErrorMessage } from '@/utils/errorToToast'

type ListOrdersResponse = _ListOrdersResponse

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  // filters (ยืนยันจริงเมื่อ apply)
  const [filters, setFilters] = useState<OrdersFiltersValue>({
    q: '',
    statuses: [], // [] = ALL
    sortBy: 'createdAt',
    sortDir: 'DESC',
    hasTracking: ''
  })

  // trigger search
  const [tick, setTick] = useState(0)
  const applyFilters = (v: OrdersFiltersValue) => {
    setPage(1)
    setFilters(v)
    setTick((x) => x + 1)
  }
  const resetFilters = () =>
    applyFilters({
      q: '',
      statuses: [],
      sortBy: 'createdAt',
      sortDir: 'DESC',
      hasTracking: ''
    })

  // summary
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false)

  // detail dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  const { getStatusIcon, getStatusBadgeColor, getStatusText } = useOrderStatus()
  const { toast } = useToast()

  // initial load
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    setTick((x) => x + 1)
  }, [])

  // fetch list
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await listOrdersRequester({
          page,
          pageSize,
          q: filters.q,
          status: filters.statuses.length ? filters.statuses.join(',') : 'ALL',
          sortBy: filters.sortBy,
          sortDir: filters.sortDir,
          hasTracking: filters.hasTracking || undefined,
          signal: ac.signal
        })
        setOrders(res.data)
        setTotal(res.meta.total)
      } catch (e) {
        if (!isAbortError(e)) {
          setOrders([])
          setTotal(0)
          const { title, description } = extractErrorMessage(e)
          toast({
            title: 'Failed to load orders',
            description,
            variant: 'destructive'
          })
          console.error('listOrders error:', e)
        }
      }
    })()
    return () => ac.abort()
  }, [tick, page, pageSize, filters, toast])

  // summary
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      setSummaryLoading(true)
      try {
        const s = await fetchOrderSummary({ signal: ac.signal })
        setSummary(s)
      } catch (e) {
        if (!isAbortError(e)) {
          const { title, description } = extractErrorMessage(e)
          toast({
            title: `Failed to load summary · ${title}`,
            description,
            variant: 'destructive'
          })
          console.error('orderSummary error:', e)
        }
      }
      setSummaryLoading(false)
    })()
    return () => ac.abort()
  }, [])

  // click stat -> set filters + search
  const handleStatClick = (p: { statuses?: string[] }) => {
    applyFilters({
      ...filters,
      statuses: p.statuses ?? []
    })
  }

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    const prev = orders.find((o) => o.id === orderId)
    if (!prev) return
    const willTouchPGW = [
      'MERCHANT_CANCELED',
      'REFUND_APPROVED',
      'REFUND_RETRY'
    ].includes(newStatus)

    // optimistic update
    setOrders((prevList) =>
      prevList.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              status: newStatus,
              statusHistory: [...(o.statusHistory || [o.status]), newStatus]
            }
      )
    )

    try {
      const res = await updateOrderRequester(orderId, { status: newStatus })
      const updated = res.data
      setOrders((list) => list.map((o) => (o.id === orderId ? updated : o)))
      setSelectedOrder((o) => (o && o.id === orderId ? updated : o))
      toast({
        title: 'Status updated',
        description: `New status: ${getStatusText(updated.status)}`
      })
      if (willTouchPGW && updated.status === 'REFUND_FAIL') {
        toast({ title: 'Refund failed', variant: 'destructive' })
      }
    } catch (e) {
      // rollback
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? (prev as Order) : o))
      )
      setSelectedOrder((o) => (o && o.id === orderId ? (prev as Order) : o))

      if (!isAbortError(e)) {
        const { title, description } = extractErrorMessage(e)
        toast({
          title: `Failed to update · ${title}`,
          description,
          variant: 'destructive'
        })
        console.error('updateOrder error:', e)
      }
    }
  }

  const handleTrackingNumberUpdate = async (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    const prev = orders.find((o) => o.id === orderId)
    if (!prev) return

    // optimistic
    setOrders((list) =>
      list.map((o) => (o.id === orderId ? { ...o, trackingNumber } : o))
    )

    try {
      const res = await updateOrderRequester(orderId, {
        trackingNumber,
        ...(carrier ? { carrier } : {})
      })
      const updated = res.data
      setOrders((list) => list.map((o) => (o.id === orderId ? updated : o)))
      setSelectedOrder((o) => (o && o.id === orderId ? updated : o))
      toast({ title: 'Tracking updated' })
    } catch (e) {
      // rollback
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? (prev as Order) : o))
      )
      setSelectedOrder((o) => (o && o.id === orderId ? (prev as Order) : o))

      if (!isAbortError(e)) {
        const { title, description } = extractErrorMessage(e)
        toast({
          title: `Failed to update tracking · ${title}`,
          description,
          variant: 'destructive'
        })
        console.error('updateTracking error:', e)
      }
    }
  }

  const handleHandedOver = async (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    const prev = orders.find((o) => o.id === orderId)
    if (!prev) return

    // optimistic
    setOrders((list) =>
      list.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              status: 'HANDED_OVER',
              statusHistory: [
                ...(o.statusHistory || [o.status]),
                'HANDED_OVER'
              ],
              trackingNumber
            }
      )
    )

    try {
      const res = await handOverOrderRequester(orderId, trackingNumber, carrier)
      const updated = res.data
      setOrders((list) => list.map((o) => (o.id === orderId ? updated : o)))
      setSelectedOrder((o) => (o && o.id === orderId ? updated : o))
      toast({ title: 'Parcel handed over' })
    } catch (e) {
      // rollback
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? (prev as Order) : o))
      )
      setSelectedOrder((o) => (o && o.id === orderId ? (prev as Order) : o))

      if (!isAbortError(e)) {
        const { title, description } = extractErrorMessage(e)
        toast({
          title: `Failed to hand over · ${title}`,
          description,
          variant: 'destructive'
        })
        console.error('handOver error:', e)
      }
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }
  const handleCloseDialog = () => {
    setIsDetailOpen(false)
    setTimeout(() => setSelectedOrder(null), 300)
  }

  return (
    <div>
      <MerchantHeader
        title="Order Management"
        description="Track and manage customer orders"
      />

      <div className="flex flex-1 flex-col gap-6 p-4">
        <OrderStats
          summary={summary}
          loading={summaryLoading}
          onStatClick={handleStatClick}
        />

        <OrdersFilters
          initial={filters}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <OrdersTable
          orders={orders}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => {
            setPage(p)
            setTick((x) => x + 1)
          }}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
            setTick((x) => x + 1)
          }}
          loading={false}
          onViewDetails={viewOrderDetails}
          getStatusIcon={getStatusIcon}
          getStatusBadgeColor={getStatusBadgeColor}
          getStatusText={getStatusText}
        />
      </div>

      <OrderDetailDialog
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={handleCloseDialog}
        onStatusChange={handleStatusChange}
        onTrackingNumberUpdate={handleTrackingNumberUpdate}
        onHandedOver={handleHandedOver}
      />
    </div>
  )
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; name?: string; message?: string }
  return (
    e?.code === 'ERR_CANCELED' ||
    e?.name === 'CanceledError' ||
    e?.name === 'AbortError'
  )
}
