export type AdminOrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "HANDED_OVER"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETE"
  | "MERCHANT_CANCELED"
  | "REFUND_REQUEST"
  | "REFUND_PROCESSING"
  | "REFUND_SUCCESS"
  | "REFUND_FAIL"

export type AdminFetchOrdersParams = {
  q?: string
  status?: AdminOrderStatus
  dateFrom?: string
  dateTo?: string
  sortBy?: "createdAt" | "grandTotal" | "status"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export type AdminOrderListItem = {
  id: number
  orderCode: string
  customerName: string
  customerEmail: string
  storeName: string
  status: AdminOrderStatus
  currencyCode: string
  grandTotalMinor: number
  createdAt: string
}

export type AdminOrderListResponse = {
  data: AdminOrderListItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export type AdminOrderStatusHistoryItem = {
  id: number
  fromStatus?: AdminOrderStatus | null
  toStatus: AdminOrderStatus
  changedByType: "ADMIN" | "CUSTOMER" | "SYSTEM"
  reason?: string | null
  source?: string | null
  createdAt: string
}

export type AdminRefundStatus =
  | "REQUESTED"
  | "APPROVED"
  | "SUCCESS"
  | "FAIL"
  | "CANCELED"

export type AdminRefundStatusHistoryItem = {
  id: number
  fromStatus?: AdminRefundStatus | null
  toStatus: AdminRefundStatus
  reason?: string | null
  changedByType?: "ADMIN" | "CUSTOMER" | "SYSTEM" | null
  source?: string | null
  createdAt: string
}

export type AdminRefundOrderLite = {
  id: number
  status: AdminRefundStatus
  amountMinor: number
  currencyCode: string
  reason?: string | null
  refundChannel?: string | null
  refundRef?: string | null
  requestedBy?: "CUSTOMER" | "MERCHANT" | null
  requestedAt?: string | null
  approvedAt?: string | null
  refundedAt?: string | null
  description?: string | null
  contactEmail?: string | null
  createdAt: string
  updatedAt: string
  timeline: AdminRefundStatusHistoryItem[]
}

export type AdminOrderDetail = {
  id: number
  orderCode: string
  status: AdminOrderStatus
  currencyCode: string
  subtotalMinor: number
  shippingFeeMinor: number
  taxTotalMinor: number
  discountTotalMinor: number
  grandTotalMinor: number
  createdAt: string
  updatedAt: string

  customer: { id: number; name: string; email: string } | null
  store: { uuid: string; name: string } | null

  shipping: {
    trackingNumber?: string | null
    carrier?: string | null
    shippingTypeName: string
    shippingPriceMinor: number
    shippedAt?: string | null
    addressSnapshot: Record<string, unknown>
  } | null

  payment: {
    id: number
    status: string // SUCCESS | FAILED | PENDING
    provider: string
    channel: string
    currencyCode: string
    amountAuthorizedMinor: number
    amountCapturedMinor: number
    amountRefundedMinor: number
    paidAt?: string | null
  } | null

  items: {
    id: number
    productUuid?: string | null // latest product uuid
    productItemUuid?: string | null // latest sku uuid
    quantity: number
    unitPriceMinor: number
    lineTotalMinor: number
    productName: string // latest product name (fallback snapshot)
    productSku?: string | null // latest sku (fallback snapshot)
    productImage?: string | null // latest sku image (fallback snapshot)
    optionsText?: string | null // built from Variation/Option (fallback snapshot)
  }[]

  timeline: AdminOrderStatusHistoryItem[]

  // แสดงเมื่อมี RefundOrder
  refunds?: AdminRefundOrderLite[]
}

// Suggest types
export type AdminOrderSuggestItem = {
  id: number
  orderCode: string
  customerName: string
  customerEmail: string
  status: AdminOrderStatus
  grandTotalMinor: number
  createdAt: string
}

export type AdminOrderSuggestResponse = AdminOrderSuggestItem[]
