export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETE'
  | 'CUSTOMER_CANCELED'
  | 'MERCHANT_CANCELED'
  | 'TRANSIT_LACK'
  | 'RE_TRANSIT'
  | 'REFUND_REQUEST'
  | 'REFUND_REJECTED'
  | 'AWAITING_RETURN'
  | 'RECEIVE_RETURN'
  | 'RETURN_VERIFIED'
  | 'RETURN_FAIL'
  | 'REFUND_APPROVED'
  | 'REFUND_PROCESSING'
  | 'REFUND_SUCCESS'
  | 'REFUND_FAIL'
  | 'REFUND_RETRY'
  | 'READY_TO_SHIP'
  | 'HANDED_OVER'

export type DashboardSeriesPoint = {
  date: string
  gmvMinor: number
  orders: number
  byStatus: Record<OrderStatus, number>
}

export type DashboardStatusDist = { name: OrderStatus; value: number }

export type DashboardTopStore = { name: string; gmvMinor: number }

export type DashboardKpis = {
  gmvMinor: number
  orders: number
  activeStores: number
  newUsers: number
}
