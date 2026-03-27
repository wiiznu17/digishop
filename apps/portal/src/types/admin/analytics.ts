export type AnalyticsKpis = {
  gmvMinor: number
  orders: number
  aovMinor: number
  paidRate: number
  cancelRate: number
  refundRate: number
  repeatRate: number
}

export type TrendsPoint = {
  date: string // yyyy-mm-dd
  gmvMinor: number
  orders: number
  aovMinor: number
}

export type StatusDistItem = {
  name:
    | 'PENDING'
    | 'PAID'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
  value: number
}

export type StoreRow = {
  storeId: number | null
  name: string
  orders: number
  gmvMinor: number
  aovMinor: number
}

export type StoreLeaderboardResponse = {
  total: number
  rows: StoreRow[]
}
