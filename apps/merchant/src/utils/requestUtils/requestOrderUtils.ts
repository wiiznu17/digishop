import type { Order, OrderStatus } from '@/types/props/orderProp'
import axios from '@/lib/axios'

export type SortDir = 'ASC' | 'DESC'

export interface ListOrdersParams {
  page?: number
  pageSize?: number
  status?: string // "ALL" | "PAID" | "PAID,PROCESSING"
  q?: string
  storeId?: number
  startDate?: string
  endDate?: string
  minTotalMinor?: number
  maxTotalMinor?: number
  hasTracking?: 'true' | 'false'
  sortBy?: 'id' | 'createdAt' | 'updatedAt' | 'grandTotalMinor'
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
  const res = await axios.get<ListOrdersResponse>('/api/merchant/orders', {
    params
  })
  return res.data
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
  const res = await axios.patch<UpdateOrderResponse>(
    `/api/merchant/orders/${orderId}`,
    payload,
    { signal }
  )
  return res.data
}

export async function handOverOrderRequester(
  orderId: string,
  trackingNumber: string,
  carrier?: string,
  signal?: AbortSignal
): Promise<UpdateOrderResponse> {
  return updateOrderRequester(
    orderId,
    { status: 'HANDED_OVER', trackingNumber, ...(carrier ? { carrier } : {}) },
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
  canceledOrders: number
  totalRevenue: number
  refundSuccessOrders: number
  completed: number
}

export async function fetchOrderSummary(
  params: {
    storeId?: number | string
    startDate?: string
    endDate?: string
    signal?: AbortSignal
  } = {}
): Promise<OrderSummary> {
  const res = await axios.get<{ data: OrderSummary }>(
    '/api/merchant/orders/summary',
    { params }
  )
  return res.data.data
}

// NEW: get by id
export async function getOrderByIdRequester(
  orderId: string,
  signal?: AbortSignal
): Promise<{ data: Order }> {
  const res = await axios.get<{ data: Order }>(
    `/api/merchant/orders/${orderId}`,
    { signal }
  )
  return res.data
}
