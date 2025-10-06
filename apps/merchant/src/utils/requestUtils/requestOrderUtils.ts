import type { Order, OrderStatus } from "@/types/props/orderProp"
import axios from "@/lib/axios"

export type SortDir = "ASC" | "DESC"

export interface ListOrdersParams {
  page?: number
  pageSize?: number
  status?: string // "ALL" | "PENDING" | ...
  q?: string
  storeId?: number
  startDate?: string // ISO
  endDate?: string // ISO
  sortBy?: "id" | "createdAt" | "updatedAt" | "grandTotalMinor"
  sortDir?: SortDir
  signal?: AbortSignal
}

export interface ListOrdersResponse {
  data: Order[]
  meta: { page: number; pageSize: number; total: number }
}

export async function listOrdersRequester(
  params: ListOrdersParams = {}
): Promise<ListOrdersResponse> {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = "ALL",
      q = "",
      storeId,
      startDate,
      endDate,
      sortBy = "createdAt", // เดิมเป็น created_at
      sortDir = "DESC",
      signal
    } = params

    const res = await axios.get<ListOrdersResponse>("/api/merchant/orders", {
      params: {
        page,
        pageSize,
        status,
        q,
        storeId,
        startDate,
        endDate,
        sortBy,
        sortDir
      },
      signal
    })

    return res.data
  } catch (err) {
    console.error("❌ listOrdersRequester error:", err)
    throw err
  }
}

export interface UpdateOrderPayload {
  status?: OrderStatus
  trackingNumber?: string
  carrier?: string
}

export interface UpdateOrderResponse {
  data: Order
}

export async function updateOrderRequester(
  orderId: string,
  payload: UpdateOrderPayload,
  signal?: AbortSignal
): Promise<UpdateOrderResponse> {
  try {
    const res = await axios.patch<UpdateOrderResponse>(
      `/api/merchant/orders/${orderId}`,
      payload,
      { signal }
    )
    return res.data
  } catch (err) {
    console.error(`❌ updateOrderRequester failed (orderId=${orderId}):`, err)
    throw err
  }
}

/** Helper case HANDED_OVER และแนบเลขพัสดุ */
export async function handOverOrderRequester(
  orderId: string,
  trackingNumber: string,
  carrier?: string,
  signal?: AbortSignal
): Promise<UpdateOrderResponse> {
  return updateOrderRequester(
    orderId,
    {
      status: "HANDED_OVER",
      trackingNumber,
      ...(carrier ? { carrier } : {})
    },
    signal
  )
}

export type OrderSummary = {
  totalOrders: number
  pendingPayment: number
  paidOrders: number
  processing: number
  handedOver: number
  refundRequests: number
  totalRevenue: number // หน่วยบาท (major)
  totalRevenueMinor: number // หน่วยสตางค์ (minor)
  completedToday?: number
}

export async function fetchOrderSummary(
  params: {
    storeId?: number | string
    startDate?: string
    endDate?: string
    signal?: AbortSignal
  } = {}
): Promise<OrderSummary> {
  const { storeId, startDate, endDate, signal } = params
  const res = await axios.get<{ data: OrderSummary }>(
    "/api/merchant/orders/summary",
    {
      params: { storeId, startDate, endDate },
      signal
    }
  )
  return res.data.data
}
