export interface Product {
  id: number
  uuid: string
  name: string
  description?: string
  images?: { url: string; blobName?: string; fileName?: string }[]
  items?: ProductItem[]
  store?: Store
  category?: Category
}

export interface ProductItem {
  id: number
  sku: string
  priceMinor: number
  stockQuantity: number
  productItemImage?: { url: string }[]
  configurations?: {
    variationOption?: { value: string; variation?: { name: string } }
  }[]
}

export interface Store {
  id: number
  uuid: string
  storeName: string
  status?: string
  products?: Product[]
}

export interface Category {
  id: number
  name: string
}

export interface Address {
  id?: number
  userId?: number
  recipientName: string
  phone: string
  address_number: string
  building?: string
  subStreet?: string
  street: string
  subdistrict: string
  district: string
  province: string
  country: string
  postalCode: string
  addressType: string
  isDefault?: boolean
}

export interface Order {
  id: number
  reference: string
  status: string
  currencyCode: string
  grandTotalMinor: number
  subtotalMinor: number
  shippingFeeMinor: number
  discountTotalMinor: number
  orderNote?: string
  createdAt: string
  updatedAt?: string
  items?: OrderItem[]
  checkout?: { id: number; orderCode: string; payment?: Payment }
  shippingInfo?: { address?: Address; shippingType?: ShippingType }
  refundOrders?: RefundOrder[]
}

export interface OrderItem {
  id: number
  quantity: number
  unitPriceMinor: number
  productNameSnapshot?: string
  productItem?: ProductItem
}

export interface Payment {
  payment_method?: string
  status?: string
  pgw_status?: string
  expiryAt?: string
  paidAt?: string
  url_redirect?: string
}

export interface ShippingType {
  id: number
  name: string
  description?: string
  estimatedDays: number
  price: number
}

export interface RefundOrder {
  id: number
  status: string
  reason?: string
  amountMinor: number
}
