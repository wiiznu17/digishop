import {
  OrderStatus,
  RefundStatus,
  ReturnShipmentStatus,
  ShippingStatus
} from '@digishop/db'

export type OrderSortField =
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'grandTotalMinor'
export type OrderSortDir = 'ASC' | 'DESC'

export type OrdersSummaryQuery = {
  startDate?: string
  endDate?: string
}

export type OrderListQuery = {
  page?: string
  pageSize?: string
  status?: string
  q?: string
  startDate?: string
  endDate?: string
  minTotalMinor?: string
  maxTotalMinor?: string
  hasTracking?: string
  sortBy?: string
  sortDir?: string
}

export type UpdateOrderPayload = {
  status?: OrderStatus | string
  reason?: string
  needToReturn?: boolean
}

export type UpdateOrderInput = {
  orderId: string
  storeId?: number
  authMode?: 'service' | 'user'
  userSub?: number | string
  userId?: number | string
  headers: {
    requestId?: string
    correlationId?: string
    userAgent?: string
  }
  ip?: string
  payload: UpdateOrderPayload
}

export type PgwVoidRefundResp = {
  request_uid?: string
  res_code?: string
  res_desc?: string
}

export type PgwDetailResp = {
  status?: string
  transaction?: { status?: string }
  [key: string]: unknown
}

export type SerializedShippingAddress = {
  recipientName: string
  phone: string
  addressNumber?: string
  building?: string
  subStreet?: string
  street: string
  subdistrict?: string
  district: string
  province: string
  postalCode: string
  country: string
}

export type SerializedOrderItem = {
  id: string
  sku: string
  name: string
  quantity: number
  price: number
  discount: number
  taxRate: number
}

export type SerializedShippingEvent = {
  id: number
  fromStatus: string | null
  toStatus: string
  description: string | null
  location: string | null
  occurredAt: Date
  createdAt: Date
}

export type SerializedReturnShipment = {
  id: number
  status: ReturnShipmentStatus
  carrier: string | null
  trackingNumber: string | null
  shippedAt: Date | null
  deliveredBackAt: Date | null
  fromAddressSnapshot: unknown
  toAddressSnapshot: unknown
  events: SerializedShippingEvent[]
}

export type SerializedRefund = {
  id: number
  status: RefundStatus
  amountMinor: number
  currencyCode: string
  reason: string | null
  requestedBy: string
  requestedAt: Date
  approvedAt: Date | null
  refundedAt: Date | null
}

export type SerializedOrder = {
  id: string
  orderCode: string
  createdAt: Date
  updatedAt: Date
  status: OrderStatus
  statusHistory: string[]
  currency: string
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  grandTotal: number
  paymentMethod: string
  payment?: {
    provider?: string
    providerRef?: string
    channel?: string
    pgwStatus?: string
    paidAt?: Date
    authorized: number
    captured: number
    refunded: number
  }
  shippingType?: string
  trackingNumber?: string
  carrier?: string
  shippedAt?: Date
  deliveredAt?: Date
  returnedToSenderAt?: Date
  shippingStatus?: ShippingStatus
  shippingAddress: SerializedShippingAddress
  shipping?: {
    events: SerializedShippingEvent[]
  }
  returnShipments: SerializedReturnShipment[]
  customerName: string
  customerEmail: string
  customerPhone: string
  orderItems: SerializedOrderItem[]
  notes?: string
  refunds: SerializedRefund[]
}

export type OrdersSummaryData = {
  totalOrders: number
  pendingPayment: number
  paidOrders: number
  processing: number
  handedOver: number
  refundRequests: number
  refundSuccessOrders: number
  canceledOrders: number
  totalRevenueMinor: number
  totalRevenue: number
  completed: number
}

export type OrderListResponse = {
  data: SerializedOrder[]
  meta: {
    page: number
    pageSize: number
    total: number
  }
}
