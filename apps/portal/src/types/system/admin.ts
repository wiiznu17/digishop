// ── enums / unions ─────────────────────────────────────────────
export enum AdminUserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export type AdminRoleSlug = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'VIEWER'

export type PermissionEffect = 'ALLOW' | 'DENY'

// ── list / suggest ─────────────────────────────────────────────
export type AdminListItem = {
  id: number
  name: string
  email: string
  status: AdminUserStatus // ← ใช้ enum
  roles: AdminRoleSlug[]
  primaryRole: AdminRoleSlug
  lastLoginAt?: string | null
}

export type AdminListResponse = {
  data: AdminListItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export type AdminSuggestItem = { id: number; name: string; email: string }

export type RolesDetail = {
  id: number
  slug: AdminRoleSlug
  name: string
  description?: string | null
  isSystem: boolean
}

export type AdminPermission = {
  id: number
  slug: string
  resource: string
  action: string
  effect: PermissionEffect
}

export type AdminSession = {
  id: number
  jti: string
  ip?: string | null
  userAgent?: string | null
  expiresAt: string
  revokedAt?: string | null
  createdAt: string
}

export type AdminRoleHistoryItem = {
  id: number
  roleId: number | null
  roleSlug: AdminRoleSlug | null // ← แก้จาก string | null
  roleName: string | null
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export type AdminDetail = {
  id: number
  name: string
  email: string
  status: AdminUserStatus
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
  roles: RolesDetail[]
  permissions: AdminPermission[]
  sessions: AdminSession[]
  roleHistory: AdminRoleHistoryItem[]
  canReinvite: boolean
  canResetPassword: boolean
  reinviteCooldownSeconds?: number
  lastInviteAt?: string
  reinviteAvailableAt?: string
}
