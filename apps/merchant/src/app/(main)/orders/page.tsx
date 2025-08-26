"use client"

import { useEffect, useRef, useState } from "react"
import { MerchantHeader } from "@/components/dashboard-header"
import { Order, OrderStatus } from "@/types/props/orderProp"
import { OrderDetailDialog } from "@/components/order/order-detail-dialog"
import { OrdersTable } from "@/components/order/orders-table"
import { OrderStats } from "@/components/order/order-stats"
import { useOrderStatus } from "@/hooks/useOrderStatus"
import { listOrdersRequester } from "@/utils/requestUtils/requestOrderUtils"

/** --- Strongly typed API response from listOrders --- */
type ListOrdersResponse = {
  data: Order[]
  meta: {
    page: number
    pageSize: number
    total: number
  }
}

/** --- Strongly typed request options for listOrders --- */
type ListOrdersParams = {
  page: number
  pageSize: number
  status: string
  q: string
  sortBy: "created_at" | "updated_at"
  sortDir: "ASC" | "DESC"
  signal?: AbortSignal
}

export default function OrdersPage() {
  // table data & ui state
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // detail dialog state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  // only what the page needs from the hook
  const { getStatusIcon, getStatusBadgeColor, getStatusText } = useOrderStatus()

  // debounce search (250ms)
  const debouncedQ = useDebouncedValue<string>(searchTerm, 250)

  // keep selectedOrder in sync after list reload
  useEffect(() => {
    if (!selectedOrder) return
    const fresh = orders.find((o) => o.id === selectedOrder.id)
    if (fresh) setSelectedOrder(fresh)
  }, [orders, selectedOrder?.id])

  // fetch list
  useEffect(() => {
    const ac = new AbortController()

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const params: ListOrdersParams = {
          page,
          pageSize,
          status: statusFilter,
          q: debouncedQ,
          sortBy: "created_at",
          sortDir: "DESC",
          signal: ac.signal
        }
        const res: ListOrdersResponse = await listOrdersRequester(params)
        console.log("All order: ", res)
        setOrders(res.data)
        setTotal(res.meta.total)
      } catch (e: unknown) {
        // แยกกรณีถูกยกเลิกกับ error จริง
        if (isAbortError(e)) {
          // ignore
        } else {
          setError("Failed to load orders")
          setOrders([])
          setTotal(0)
        }
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => ac.abort()
  }, [page, pageSize, statusFilter, debouncedQ])

  // optimistic local updates (ยังไม่ยิง API เปลี่ยนสถานะ)
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        const newHistory = [...(o.statusHistory || [o.status]), newStatus]
        return { ...o, status: newStatus, statusHistory: newHistory }
      })
    )
  }

  const handleTrackingNumberUpdate = (
    orderId: string,
    trackingNumber: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, trackingNumber } : o))
    )
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
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <OrderStats orders={orders} />

        <OrdersTable
          orders={orders}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={(v) => {
            setPage(1)
            setSearchTerm(v)
          }}
          onStatusFilterChange={(v) => {
            setPage(1)
            setStatusFilter(v)
          }}
          onViewDetails={viewOrderDetails}
          getStatusIcon={getStatusIcon}
          getStatusBadgeColor={getStatusBadgeColor}
          getStatusText={getStatusText}
          // ถ้ามี pagination ใน table ให้เชื่อมต่อ state ด้านล่าง
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={loading}
        />
      </div>

      <OrderDetailDialog
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={handleCloseDialog}
        onStatusChange={handleStatusChange}
        onTrackingNumberUpdate={handleTrackingNumberUpdate}
      />
    </div>
  )
}

/** small debounce hook — no `any`, no NodeJS.Timeout */
function useDebouncedValue<T>(value: T, delay = 250): T {
  const [v, setV] = useState<T>(value)
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(() => setV(value), delay)
    return () => {
      if (tRef.current) clearTimeout(tRef.current)
    }
  }, [value, delay])

  return v
}

/** narrow unknown error into “abort-like” error safely */
function isAbortError(err: unknown): boolean {
  if (!err) return false
  // Axios cancellation (v1) uses 'CanceledError' or message 'canceled'
  if (
    typeof err === "object" &&
    "name" in err &&
    (err as { name?: string }).name === "CanceledError"
  ) {
    return true
  }
  if (
    typeof err === "object" &&
    "message" in err &&
    (err as { message?: string }).message === "canceled"
  ) {
    return true
  }
  // Native AbortController
  if (
    typeof err === "object" &&
    "name" in err &&
    (err as { name?: string }).name === "AbortError"
  ) {
    return true
  }
  return false
}
