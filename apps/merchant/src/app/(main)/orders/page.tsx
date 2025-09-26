"use client"

import { useEffect, useRef, useState } from "react"
import { MerchantHeader } from "@/components/dashboard-header"
import { Order, OrderStatus } from "@/types/props/orderProp"
import { OrderDetailDialog } from "@/components/order/order-detail-dialog"
import { OrdersTable } from "@/components/order/orders-table"
import { OrderStats } from "@/components/order/order-stats"
import { useOrderStatus } from "@/hooks/useOrderStatus"
import {
  listOrdersRequester,
  updateOrderRequester,
  handOverOrderRequester,
  type ListOrdersParams as _ListOrdersParams,
  type ListOrdersResponse as _ListOrdersResponse,
  OrderSummary,
  fetchOrderSummary
} from "@/utils/requestUtils/requestOrderUtils"
import { useToast } from "@/hooks/use-toast"
// import { useToast } from "@/components/ui/use-toast"

/** --- Strongly typed API response from listOrders --- */
type ListOrdersResponse = _ListOrdersResponse

/** --- Strongly typed request options for listOrders --- */
type ListOrdersParams = _ListOrdersParams & {
  sortBy: "created_at" | "updated_at"
  sortDir: "ASC" | "DESC"
}

export default function OrdersPage() {
  // table data & ui state
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  // ค่าที่ “ยืนยันแล้ว” (จะเอาไปยิงจริงเมื่อกด Search)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // ตัวคุม “จังหวะยิง” manual search / initial load
  const [queryTick, setQueryTick] = useState(0)
  const bumpQuery = () => setQueryTick((v) => v + 1)

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // summary state
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false)

  // detail dialog state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)

  const { getStatusIcon, getStatusBadgeColor, getStatusText } = useOrderStatus()
  const { toast } = useToast()

  // --- Initial load ครั้งเดียวแม้มี StrictMode ---
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    bumpQuery() // ยิงครั้งแรก
  }, [])

  // --- Fetch list: ยิงเมื่อ queryTick เปลี่ยน หรือ page/pageSize เปลี่ยน ---
  useEffect(() => {
    if (queryTick === 0) return // ยังไม่สั่งยิง
    const ac = new AbortController()
    let aborted = false
    ac.signal.addEventListener("abort", () => {
      aborted = true
    })

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const params: ListOrdersParams = {
          page,
          pageSize,
          status: statusFilter,
          q: searchTerm, // ใช้ค่าที่ถูก “ยืนยันแล้ว”
          sortBy: "created_at",
          sortDir: "DESC",
          signal: ac.signal
        }
        const res: ListOrdersResponse = await listOrdersRequester(params)
        if (aborted) return
        setOrders(res.data)
        setTotal(res.meta.total)
      } catch (e) {
        if (!isAbortError(e)) {
          if (aborted) return
          setError("Failed to load orders")
          setOrders([])
          setTotal(0)
        }
      } finally {
        if (!aborted) setLoading(false)
      }
    }

    run()
    return () => ac.abort()
  }, [queryTick, page, pageSize, statusFilter, searchTerm])

  // summary คงเดิม
  useEffect(() => {
    const ac = new AbortController()
    let aborted = false
    ac.signal.addEventListener("abort", () => {
      aborted = true
    })
    const run = async () => {
      setSummaryLoading(true)
      try {
        const s = await fetchOrderSummary({ signal: ac.signal })
        if (!aborted) setSummary(s)
      } catch (e) {
        if (!isAbortError(e)) console.error("Failed to load summary", e)
        if (!aborted) setSummary(null)
      } finally {
        if (!aborted) setSummaryLoading(false)
      }
    }
    run()
    return () => ac.abort()
  }, [])

  // ===== Backed-by-API updates =====

  // Update status (optimistic -> call API -> rollback if failed)
  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    const prev = orders.find((o) => o.id === orderId)
    if (!prev) return

    const willTouchPGW = [
      "MERCHANT_CANCELED",
      "REFUND_APPROVED",
      "REFUND_RETRY"
    ].includes(newStatus)

    // optimistic
    setOrders((prevList) =>
      prevList.map((o) => {
        if (o.id !== orderId) return o
        const newHistory = [...(o.statusHistory || [o.status]), newStatus]
        return { ...o, status: newStatus, statusHistory: newHistory }
      })
    )

    if (willTouchPGW) {
      toast({
        title: "Contacting payment gateway…",
        description: "Submitting refund request to PGW."
      })
    }

    try {
      const res = await updateOrderRequester(orderId, { status: newStatus })
      const updated = res.data

      setOrders((list) => list.map((o) => (o.id === orderId ? updated : o)))
      setSelectedOrder((o) => (o && o.id === orderId ? updated : o))

      // show result toast for PGW-related actions
      if (willTouchPGW) {
        if (updated.status === "REFUND_PROCESSING") {
          toast({
            title: "Refund accepted",
            description:
              "Payment gateway accepted the refund. Waiting for processing."
          })
        } else if (updated.status === "REFUND_FAIL") {
          toast({
            title: "Refund failed",
            description:
              "Payment gateway rejected or errored. You can retry from this screen.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Status updated",
            description: `New status: ${getStatusText(updated.status)}`
          })
        }
      } else {
        toast({
          title: "Status updated",
          description: `New status: ${getStatusText(updated.status)}`
        })
      }
    } catch (e) {
      // rollback
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? (prev as Order) : o))
      )
      setSelectedOrder((o) => (o && o.id === orderId ? (prev as Order) : o))
      console.error(e)
      toast({
        title: "Failed to update",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleTrackingNumberUpdate = async (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    const prev = orders.find((o) => o.id === orderId)
    if (!prev) return

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

      toast({
        title: "Tracking updated",
        description: "Tracking number has been saved."
      })
    } catch (e) {
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? (prev as Order) : o))
      )
      setSelectedOrder((o) => (o && o.id === orderId ? (prev as Order) : o))
      console.error(e)
      toast({
        title: "Failed to update tracking",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleHandedOver = async (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    const prev = orders.find((o) => o.id === orderId)
    if (!prev) return

    setOrders((list) =>
      list.map((o) => {
        if (o.id !== orderId) return o
        const newStatus: OrderStatus = "HANDED_OVER"
        const newHistory = [...(o.statusHistory || [o.status]), newStatus]
        return {
          ...o,
          status: newStatus,
          statusHistory: newHistory,
          trackingNumber
        }
      })
    )

    try {
      const res = await handOverOrderRequester(orderId, trackingNumber, carrier)
      const updated = res.data
      setOrders((list) => list.map((o) => (o.id === orderId ? updated : o)))
      setSelectedOrder((o) => (o && o.id === orderId ? updated : o))

      toast({
        title: "Parcel handed over",
        description: "Status updated and tracking number saved."
      })
    } catch (e) {
      setOrders((list) =>
        list.map((o) => (o.id === orderId ? (prev as Order) : o))
      )
      setSelectedOrder((o) => (o && o.id === orderId ? (prev as Order) : o))
      console.error(e)
      toast({
        title: "Failed to hand over",
        description: "Please try again.",
        variant: "destructive"
      })
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
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <OrderStats summary={summary} loading={summaryLoading} />

        <OrdersTable
          orders={orders}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          // เปลี่ยนเป็น “ยืนยันค่าแล้วค่อยยิง”
          onSearchChange={(v) => {
            setPage(1)
            setSearchTerm(v)
          }}
          onStatusFilterChange={(v) => {
            setPage(1)
            setStatusFilter(v)
          }}
          // ปุ่ม Search: สั่งยิง
          onTriggerSearch={() => {
            setPage(1)
            bumpQuery()
          }}
          // pagination: เปลี่ยนแล้วยิงทันที
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => {
            setPage(p)
            bumpQuery()
          }}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
            bumpQuery()
          }}
          loading={loading}
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

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as { code?: string; name?: string; message?: string }
  return (
    e?.code === "ERR_CANCELED" ||
    e?.name === "CanceledError" ||
    e?.name === "AbortError" ||
    (typeof e?.message === "string" && e.message.toLowerCase() === "canceled")
  )
}
