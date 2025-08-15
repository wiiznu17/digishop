import { Customer } from "./customerProp"
import { Product } from "./productProp"

export type OrderStatus =
  | "PENDING"
  | "CUSTOMER_CANCELED"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "REFUND_REQUEST"
  | "TRANSIT_LACK"
  | "AWAITING_RETURN"
  | "RETURN_FAIL"
  | "RETURN_VERIFIED"
  | "REFUND_APPROVED"
  | "REFUND_FAIL"
  | "REFUND_SUCCESS"
  | "COMPLETE"

export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
}
export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: {
    recipientName: string
    phone: string
    address_number?: string
    building?: string
    subStreet?: string
    street: string
    subdistrict?: string
    district: string
    province: string
    postalCode: string
    country: string
  }
  createdAt: string
  totalPrice: number
  shippingCost: number
  tax: number
  status: OrderStatus
  paymentMethod: string
  trackingNumber?: string
  orderitems: OrderItem[]
  notes?: string
  refundReason?: string
  refundAmount?: number
}
