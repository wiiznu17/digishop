export type DashboardRecentSale = {
  orderId: string
  customerId?: string
  customerName: string
  customerEmail: string
  amountMinor: number
  createdAt: Date
}

export type DashboardSummaryStats = {
  totalRevenueMinor: number
  ordersCount: number
  productsCount: number
  activeCustomers: number
  revenueChangeText: string
  ordersChangeText: string
  thisMonthSalesCount: number
  recentSales: DashboardRecentSale[]
  aovMinor: number
  totalImages: number
}

export type DashboardSummaryResponse = {
  totalRevenueMinor: number
  ordersCount: number
  productsCount: number
  activeCustomers: number
  revenueChangeText: string
  ordersChangeText: string
  productsChangeText: string
  customersChangeText: string
  thisMonthSalesCount: number
  recentSales: DashboardRecentSale[]
  revenueSeries: unknown[]
  conversionRatePct: number
  aovMinor: number
  customerSatisfaction: string
  totalImages: number
}
