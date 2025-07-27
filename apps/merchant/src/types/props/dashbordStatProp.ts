export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: number
  ordersGrowth: number
  productsGrowth: number
  customersGrowth: number
}

export interface RevenueData {
  date: string
  revenue: number
  orders: number
}

export interface CategoryData {
  category: string
  revenue: number
  orders: number
}
