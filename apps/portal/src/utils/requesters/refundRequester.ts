// apps/portal/src/utils/requesters/refundRequester.ts
import axios from "@/lib/axios"

export type AdminRefundLite = {
  id: number
  orderId: number
  orderCode: string
  customerName: string
  customerEmail: string
  storeName: string
  status: "REQUESTED" | "APPROVED" | "SUCCESS" | "FAIL" | "CANCELED"
  amountMinor: number
  currencyCode: string
  requestedAt: string | null
  approvedAt: string | null
  refundedAt: string | null
  createdAt: string
}

type ListMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
type ListResponse = { data: AdminRefundLite[]; meta: ListMeta }

export async function fetchAdminRefundListRequester(params: {
  q?: string
  orderCode?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "status" | "amount"
  sortDir?: "asc" | "desc"
}): Promise<ListResponse | null> {
  try {
    const res = await axios.get("/api/admin/refunds/list", {
      params,
      withCredentials: true
    })
    return res.data
  } catch (e) {
    console.error("fetch order refund error:", e)
    return null
  }
}

export async function fetchAdminOrderSuggestByCode(
  q: string
): Promise<Array<{ id: number; orderCode: string }>> {
  const key = q?.trim()
  if (!key) return []
  try {
    console.log("fetchAdminOrderSuggestByCode q=", q)
    const res = await axios.get("/api/admin/orders/suggest", {
      params: { q: key },
      withCredentials: true
    })
    console.log("fetchAdminOrderSuggestByCode res=", res.data)
    return res.data
  } catch {
    // suggest ไม่ critical — ถ้าพลาดให้คืน [] เงียบๆ
    return []
  }
}
