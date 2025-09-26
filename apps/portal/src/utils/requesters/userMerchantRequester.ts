import axios from "@/lib/axios"
import type { AdminUserLite, AdminUserDetail } from "@/types/admin/users"
import type { AdminStoreLite, AdminStoreDetail } from "@/types/admin/stores"

type ListMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// ── Users
export async function fetchAdminUserListRequester(params: {
  q?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "name" | "email"
  sortDir?: "asc" | "desc"
}) {
  const r = await axios.get<{ data: AdminUserLite[]; meta: ListMeta }>(
    "/api/admin/users/list",
    { params }
  )
  return r.data
}

export async function fetchAdminUserSuggest(q: string) {
  if (!q.trim()) return [] as Array<{ id: number; name: string; email: string }>
  const r = await axios.get<Array<{ id: number; name: string; email: string }>>(
    "/api/admin/users/suggest",
    { params: { q } }
  )
  return r.data
}

export async function fetchAdminUserDetail(id: number) {
  const r = await axios.get<AdminUserDetail>(`/api/admin/users/${id}/detail`)
  return r.data
}

// ── Merchants / Stores
export async function fetchAdminStoreListRequester(params: {
  q?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "status" | "storeName" | "productCount"
  sortDir?: "asc" | "desc"
}) {
  const r = await axios.get<{ data: AdminStoreLite[]; meta: ListMeta }>(
    "/api/admin/stores/list",
    { params }
  )
  return r.data
}

export async function fetchAdminStoreSuggest(q: string) {
  if (!q.trim()) return [] as Array<{ id: number; storeName: string }>
  const r = await axios.get<Array<{ id: number; storeName: string }>>(
    "/api/admin/stores/suggest",
    { params: { q } }
  )
  return r.data
}

export async function fetchAdminStoreDetail(id: number) {
  const r = await axios.get<AdminStoreDetail>(`/api/admin/stores/${id}/detail`)
  return r.data
}
