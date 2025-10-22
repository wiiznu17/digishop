import axios from "@/lib/axios"

export type RecentSale = {
  orderId: string
  customerName: string
  customerEmail: string
  amountMinor: number
  createdAt: string
}

export type MerchantDashboard = {
  totalRevenueMinor: number
  ordersCount: number
  productsCount: number
  activeCustomers: number
  revenueChangeText: string
  ordersChangeText: string
  productsChangeText: string
  customersChangeText: string
  thisMonthSalesCount: number
  recentSales: RecentSale[]
  revenueSeries: { date: string; amountMinor: number }[]
  conversionRatePct: number
  aovMinor: number
  customerSatisfaction: string
}

export async function fetchMerchantDashboard(): Promise<MerchantDashboard> {
  try {
    const r = await axios.get<MerchantDashboard>("/api/merchant/dashboard", {
      withCredentials: true
    })
    console.log("Merchant dashboard data:", r.data)
    return r.data
  } catch (error) {
    console.error("Error fetching merchant dashboard:", error)
    throw error
  }
}
