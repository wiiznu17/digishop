import { Customer } from "./customerProp"
import { Product } from "./productProp"

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer: Customer
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  createdAt: Date
  updatedAt: Date
}
