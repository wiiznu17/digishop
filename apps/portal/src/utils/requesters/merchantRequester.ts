import axios from "@/lib/axios"
import type { AdminStoreLite, AdminStoreDetail } from "@/types/admin/stores"

type ListMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// ── Merchants / Stores
export async function fetchAdminStoreListRequester(params: {
  q?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  /** ช่วงยอดขายรวม (หน่วย major) */
  salesMin?: number
  salesMax?: number
  /** ช่วงจำนวนออเดอร์ */
  orderCountMin?: number
  orderCountMax?: number
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "status" | "storeName" | "productCount"
  sortDir?: "asc" | "desc"
}) {
  try {
    const r = await axios.get<{ data: AdminStoreLite[]; meta: ListMeta }>(
      "/api/admin/stores/list",
      { params }
    )
    return r.data
  } catch (error) {
    console.log("fetchAdminStoreListRequester error", error)
    return {
      data: [] as AdminStoreLite[],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    }
  }
  // const r = await axios.get<{ data: AdminStoreLite[]; meta: ListMeta }>(
  //   "/api/admin/stores/list",
  //   { params }
  // )
  // return r.data
}

export async function fetchAdminStoreSuggest(q: string) {
  try {
    if (!q.trim()) return [] as Array<{ id: number; storeName: string }>
    const r = await axios.get<Array<{ id: number; storeName: string }>>(
      "/api/admin/stores/suggest",
      { params: { q } }
    )
    return r.data
  } catch (error) {
    console.log("fetchAdminStoreSuggest error", error)
    return [] as Array<{ id: number; storeName: string }>
  }
}

export async function fetchAdminStoreDetail(id: number) {
  try {
    const r = await axios.get<AdminStoreDetail>(
      `/api/admin/stores/${id}/detail`
    )
    return r.data
  } catch (error) {
    console.log("fetchAdminStoreDetail error", error)
    return null
  }
}
