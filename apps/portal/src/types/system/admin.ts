export enum AdminUserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED"
}

export type AdminRoleSlug = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "VIEWER"

export type AdminListItem = {
  id: number
  name: string
  email: string
  status: "ACTIVE" | "SUSPENDED"
  roles: AdminRoleSlug[]
  primaryRole: AdminRoleSlug
  lastLoginAt?: string | null
}

export type AdminListResponse = {
  data: AdminListItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export type AdminSuggestItem = { id: number; name: string; email: string }

export type AdminDetail = {
  id: number
  name: string
  email: string
  status: "ACTIVE" | "SUSPENDED"
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
  roles: {
    id: number
    slug: AdminRoleSlug
    name: string
    description?: string | null
    isSystem: boolean
  }[]
  permissions: {
    id: number
    slug: string
    resource: string
    action: string
    effect: "ALLOW" | "DENY"
  }[]
  sessions: {
    id: number
    jti: string
    ip?: string | null
    userAgent?: string | null
    expiresAt: string
    revokedAt?: string | null
    createdAt: string
  }[]
  roleHistory: {
    id: number
    roleId: number | null
    roleSlug: string | null
    roleName: string | null
    startAt: string | null
    endAt: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    status: "ACTIVE" | "INACTIVE"
  }[]
  canReinvite: boolean
  canResetPassword: boolean
  reinviteCooldownSeconds?: number
  lastInviteAt?: string
  reinviteAvailableAt?: string
}
