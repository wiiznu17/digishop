import axios from "@/lib/axios"

export type AdminRoleListItem = {
  id: number
  slug: string
  name: string
  description?: string | null
  isSystem: boolean
  permissionCount: number
  createdAt: string
}

export type AdminRoleListResponse = {
  data: AdminRoleListItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export type AdminRoleDetail = {
  id: number
  slug: string
  name: string
  description?: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
  permissions: {
    id: number
    slug: string
    resource: string
    action: string
    effect: "ALLOW" | "DENY"
  }[]
  allPermissions: {
    id: number
    slug: string
    resource: string
    action: string
    effect: "ALLOW" | "DENY"
  }[]
}

export async function fetchRoleList(params: {
  q?: string
  sortBy?: "createdAt" | "name" | "slug"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}) {
  const r = await axios.get<AdminRoleListResponse>("/api/admin/roles/list", {
    params,
    withCredentials: true
  })
  return r.data
}

export async function fetchRoleDetail(id: number) {
  const r = await axios.get<AdminRoleDetail>(`/api/admin/roles/${id}/detail`, {
    withCredentials: true
  })
  return r.data
}

export async function createRole(payload: {
  slug: string
  name: string
  description?: string | null
}) {
  const r = await axios.post<{ id: number }>(
    "/api/admin/roles/create",
    payload,
    { withCredentials: true }
  )
  return r.data
}

export async function updateRoleMeta(
  id: number,
  payload: { name?: string; description?: string | null }
) {
  const r = await axios.patch(`/api/admin/roles/${id}/meta`, payload, {
    withCredentials: true
  })
  return r.data
}

export async function replaceRolePermissions(
  id: number,
  permissionIds: number[]
) {
  const r = await axios.put(
    `/api/admin/roles/${id}/permissions`,
    { permissionIds },
    { withCredentials: true }
  )
  return r.data
}
