import axios from '@/lib/axios'
import type {
  AdminDetail,
  AdminListResponse,
  AdminRoleSlug,
  AdminSuggestItem,
  RolesDetail
} from '@/types/system/admin'
import { AdminRoleDetail } from './rolesRequester'

export async function fetchAdminList(params: {
  q?: string
  role?: string
  status?: string
  sortBy?: 'createdAt' | 'name' | 'email' | 'lastLoginAt'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}) {
  const r = await axios.get<AdminListResponse>('/api/admin/admins/list', {
    params,
    withCredentials: true
  })
  return r.data
}

export async function fetchAdminSuggest(q: string) {
  if (!q.trim()) return [] as AdminSuggestItem[]
  const r = await axios.get<AdminSuggestItem[]>('/api/admin/admins/suggest', {
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
    '/api/admin/admins/create',
    payload,
    { withCredentials: true }
  )
  return r.data
}

export async function sendAdminInviteById(adminId: number) {
  await axios.post(
    `/api/admin/admins/${adminId}/invite`,
    {},
    { withCredentials: true }
  )
}

export async function resetAdminPasswordById(adminId: number) {
  await axios.post(
    `/api/admin/admins/${adminId}/reset-password`,
    {},
    { withCredentials: true }
  )
}

export async function fetchRoleOptions() {
  const r = await axios.get<RolesDetail[]>('/api/admin/admins/roles/list', {
    withCredentials: true
  })
  return r.data
}

export async function updateAdminRoles(
  adminId: number,
  roleSlugs: AdminRoleSlug[]
) {
  await axios.patch(
    `/api/admin/admins/${adminId}/roles`,
    { roleSlugs },
    { withCredentials: true }
  )
}
