import axios from "@/lib/axios"
import {
  AdminAuditLogListResponse,
  AdminAuditLogItem
} from "@/types/admin/audit"

export async function fetchAuditLogs(params: {
  q?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: "createdAt" | "action"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}) {
  const r = await axios.get<AdminAuditLogListResponse>(
    "/api/admin/audit-logs/list",
    { params, withCredentials: true }
  )
  return r.data
}

export async function fetchAuditLogDetail(id: number) {
  const r = await axios.get<AdminAuditLogItem>(
    `/api/admin/audit-logs/${id}/detail`,
    { withCredentials: true }
  )
  return r.data
}

export async function fetchAuditLogSuggest(q: string) {
  const r = await axios.get<Array<{ label: string; value: string }>>(
    "/api/admin/audit-logs/suggest",
    {
      params: { q },
      withCredentials: true
    }
  )
  return r.data
}
