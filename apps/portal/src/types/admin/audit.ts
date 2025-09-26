export type AdminAuditLogItem = {
  id: number
  actorEmail: string
  actorName: string
  action: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "ASSIGN_ROLE"
  resource: string
  targetId?: number | null
  ip?: string | null
  userAgent?: string | null
  correlationId?: string | null
  createdAt: string
  meta?: Record<string, unknown> | null
}

export type AdminAuditLogListResponse = {
  data: AdminAuditLogItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}
