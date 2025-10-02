// ───────── Enums ─────────
export type ShippingType = "STANDARD" | "EXPRESS"

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "HANDED_OVER"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETE"
  | "CUSTOMER_CANCELED"
  | "MERCHANT_CANCELED"
  | "TRANSIT_LACK"
  | "RE_TRANSIT"
  | "REFUND_REQUEST"
  | "REFUND_REJECTED"
  | "AWAITING_RETURN"
  | "RECEIVE_RETURN"
  | "RETURN_VERIFIED"
  | "RETURN_FAIL"
  | "REFUND_APPROVED"
  | "REFUND_PROCESSING"
  | "REFUND_SUCCESS"
  | "REFUND_FAIL"
  | "REFUND_RETRY"

// ✅ อิง enum ล่าสุดจากฝั่ง BE
export type ShippingStatus =
  | "PENDING"
  | "READY_TO_SHIP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "RETURN_TO_SENDER_IN_TRANSIT"
  | "RETURNED_TO_SENDER"
  | "TRANSIT_ISSUE"
  | "RE_TRANSIT"

// ───────── Entities ─────────
export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  /** unit price (major units) */
  price: number
  /** per-line discount (major units) */
  discount?: number
  /** tax rate (e.g. 7 = 7%) */
  taxRate?: number
}

export interface ShippingAddress {
  recipientName?: string
  phone?: string
  addressNumber?: string
  building?: string
  subStreet?: string
  street?: string
  subdistrict?: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
}

export interface PaymentSummary {
  provider?: string
  providerRef?: string
  channel?: string
  pgwStatus?: string
  paidAt?: string
  authorized?: number
  captured: number
  refunded?: number
}

export interface Order {
  id: string
  orderCode: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string

  shippingAddress?: ShippingAddress | null

  createdAt: string
  updatedAt?: string

  currency?: string
  subtotal?: number
  shippingCost?: number
  tax?: number
  discount?: number
  grandTotal: number

  status: OrderStatus
  statusHistory?: OrderStatus[]

  paymentMethod?: string
  payment: PaymentSummary

  // shipping snapshot-first
  shippingType?: ShippingType
  trackingNumber?: string | null
  carrier?: string
  shippedAt?: string | null
  deliveredAt?: string | null
  returnedToSenderAt?: string | null
  shippingStatus?: ShippingStatus

  orderItems?: OrderItem[]

  notes?: string | null
  refundReason?: string | null
  refundAmount?: number | null
}
