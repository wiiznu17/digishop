export type AdminUserLite = {
  id: number
  name: string
  email: string
  createdAt: string
  orderTotalMinor: number
  orderCount: number
  store?: {
    id: number
    uuid: string
    storeName: string
    status: string
  } | null
}

export type AddressLite = {
  id: number
  recipientName: string
  phone: string
  addressNumber: string
  building?: string | null
  subStreet?: string | null
  street: string
  subdistrict: string
  district: string
  province: string
  postalCode: string
  country: string
  isDefault: boolean
  addressType?: string | null
  createdAt: string
}

export type OrderLite = {
  id: number
  reference: string
  orderCode: string
  status: string
  grandTotalMinor: number
  currencyCode: string
  storeNameSnapshot: string
  createdAt: string
}

export type MonthlySpend = {
  // YYYY-MM
  month: string
  totalSpentMinor: number
  orderCount: number
}

export type AdminUserDetail = AdminUserLite & {
  addresses: AddressLite[]
  orders: {
    summary: {
      totalOrders: number
      totalSpentMinor: number
      averageOrderMinor: number
      lastOrderAt: string | null
    }
    latest: OrderLite[]
    monthly: MonthlySpend[]
  }
  reviewsCount: number
  disputesCount: number
}
