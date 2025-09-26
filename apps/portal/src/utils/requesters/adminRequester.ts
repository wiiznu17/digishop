import axios from "@/lib/axios"
import {
  AdminDetail,
  AdminListResponse,
  AdminSuggestItem
} from "@/types/system/admin"

export async function fetchAdminList(params: {
  q?: string
  role?: string
  status?: string
  sortBy?: "createdAt" | "name" | "email" | "lastLoginAt"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}) {
  const r = await axios.get<AdminListResponse>("/api/admin/admins/list", {
    params,
    withCredentials: true
  })
  return r.data
}

export async function fetchAdminSuggest(q: string) {
  if (!q.trim()) return [] as AdminSuggestItem[]
  const r = await axios.get<AdminSuggestItem[]>("/api/admin/admins/suggest", {
    params: { q },
    withCredentials: true
  })
  return r.data
}

export async function fetchAdminDetail(id: number) {
  const r = await axios.get<AdminDetail>(`/api/admin/admins/${id}/detail`, {
    withCredentials: true
  })
  return r.data
}

export async function createAdminUser(payload: {
  email: string
  name: string
  roleSlug: string
}) {
  const r = await axios.post<{ id: number }>(
    "/api/admin/admins/create",
    payload,
    { withCredentials: true }
  )
  return r.data
}
