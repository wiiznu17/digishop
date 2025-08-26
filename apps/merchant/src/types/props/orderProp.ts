export type ShippingType = "STANDARD" | "EXPRESS"

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETE"
  | "CUSTOMER_CANCELED"
  | "MERCHANT_REJECT"
  | "TRANSIT_LACK"
  | "RE_TRANSIT"
  | "REFUND_REQUEST"
  | "AWAITING_RETURN"
  | "RECEIVE_RETURN"
  | "RETURN_VERIFIED"
  | "RETURN_FAIL"
  | "REFUND_APPROVED"
  | "REFUND_SUCCESS"
  | "REFUND_FAIL"

export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
}

export interface ShippingAddress {
  recipientName?: string
  phone?: string
  address_number?: string
  building?: string
  subStreet?: string
  street?: string
  subdistrict?: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
}

export interface Order {
  id: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: ShippingAddress | null
  createdAt: string
  updatedAt?: string
  totalPrice: number
  shippingCost?: number
  tax?: number
  status: OrderStatus
  statusHistory?: OrderStatus[]
  paymentMethod?: string
  shippingType?: ShippingType
  trackingNumber?: string | null
  orderItems?: OrderItem[] // ← ปรับเป็น optional เพื่อป้องกัน undefined
  notes?: string | null
  refundReason?: string | null
  refundAmount?: number | null
}
