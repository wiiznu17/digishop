export type AdminStoreLite = {
  id: number
  uuid: string
  storeName: string
  email: string
  status: string
  ownerName: string
  ownerEmail: string
  productCount: number
  createdAt: string
  /** เพิ่มสำหรับ list */
  orderTotalMinor: number
  orderCount: number
}

export type AdminStoreDetail = AdminStoreLite & {
  orders: {
    summary: {
      totalOrders: number
      totalSalesMinor: number
      averageOrderMinor: number
      lastOrderAt: string | null
    }
    monthly: Array<{
      month: string // "YYYY-MM"
      totalSalesMinor: number
      orderCount: number
    }>
    latest: Array<{
      id: number
      reference: string
      orderCode: string
      status: string
      grandTotalMinor: number
      currencyCode: string
      createdAt: string
      customer: { id: number; name: string; email: string }
      items: Array<{ productId: number; productName: string }>
    }>
  }
}
