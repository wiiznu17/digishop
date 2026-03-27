import type { QueryInterface } from 'sequelize'
import { QueryTypes } from 'sequelize'

type MapMatrix = Record<string, string[]> // roleSlug -> permissionSlugs[]

const MATRIX: MapMatrix = {
  SUPER_ADMIN: [
    // all permissions
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'ANALYTICS_EXPORT',
    'ORDERS_READ',
    'ORDERS_EXPORT',
    'REFUNDS_READ',
    'REFUNDS_EXPORT',
    'PRODUCTS_READ',
    'PRODUCTS_UPDATE',
    'CATEGORIES_READ',
    'CATEGORIES_CREATE',
    'CATEGORIES_UPDATE',
    'CATEGORIES_DELETE',
    'CUSTOMERS_READ',
    'CUSTOMERS_SUSPEND',
    'MERCHANTS_READ',
    'MERCHANTS_APPROVE',
    'MERCHANTS_SUSPEND',
    'ADMIN_USERS_READ',
    'ADMIN_USERS_CREATE',
    'ADMIN_USERS_UPDATE',
    'ADMIN_USERS_DELETE',
    'ROLES_READ',
    'ROLES_CREATE',
    'ROLES_UPDATE',
    'ROLES_DELETE',
    'ROLES_ASSIGN',
    'AUDIT_LOGS_READ',
    'AUDIT_LOGS_EXPORT'
  ],

  PLATFORM_ADMIN: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'ANALYTICS_EXPORT',
    'ORDERS_READ',
    'ORDERS_EXPORT',
    'REFUNDS_READ',
    'REFUNDS_EXPORT',
    'PRODUCTS_READ',
    'PRODUCTS_UPDATE',
    'CATEGORIES_READ',
    'CATEGORIES_CREATE',
    'CATEGORIES_UPDATE',
    'CATEGORIES_DELETE',
    'CUSTOMERS_READ',
    'CUSTOMERS_SUSPEND',
    'MERCHANTS_READ',
    'MERCHANTS_APPROVE',
    'MERCHANTS_SUSPEND',
    // RBAC & Admin Users: read-only audit
    'AUDIT_LOGS_READ'
  ],

  RBAC_ADMIN: [
    'DASHBOARD_VIEW',
    'ADMIN_USERS_READ',
    'ADMIN_USERS_CREATE',
    'ADMIN_USERS_UPDATE',
    'ADMIN_USERS_DELETE',
    'ROLES_READ',
    'ROLES_CREATE',
    'ROLES_UPDATE',
    'ROLES_DELETE',
    'ROLES_ASSIGN',
    'AUDIT_LOGS_READ',
    'AUDIT_LOGS_EXPORT'
  ],

  OPERATIONS_MANAGER: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'ORDERS_READ',
    'ORDERS_EXPORT',
    'REFUNDS_READ',
    'REFUNDS_EXPORT',
    'CUSTOMERS_READ',
    'CUSTOMERS_SUSPEND',
    'MERCHANTS_READ',
    'MERCHANTS_APPROVE',
    'MERCHANTS_SUSPEND',
    'AUDIT_LOGS_READ'
  ],

  CATALOG_MANAGER: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'PRODUCTS_READ',
    'PRODUCTS_UPDATE',
    'CATEGORIES_READ',
    'CATEGORIES_CREATE',
    'CATEGORIES_UPDATE',
    'CATEGORIES_DELETE',
    'AUDIT_LOGS_READ'
  ],

  MERCHANT_OPERATIONS: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'CUSTOMERS_READ',
    'MERCHANTS_READ',
    'MERCHANTS_APPROVE',
    'MERCHANTS_SUSPEND',
    'ORDERS_READ',
    'REFUNDS_READ',
    'AUDIT_LOGS_READ'
  ],

  SUPPORT_AGENT: [
    'DASHBOARD_VIEW',
    'ORDERS_READ',
    'REFUNDS_READ',
    'PRODUCTS_READ',
    'CATEGORIES_READ',
    'CUSTOMERS_READ',
    'MERCHANTS_READ',
    'ANALYTICS_VIEW',
    'AUDIT_LOGS_READ'
  ],

  ANALYST: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'ANALYTICS_EXPORT',
    'ORDERS_READ',
    'REFUNDS_READ',
    'PRODUCTS_READ',
    'CATEGORIES_READ',
    'CUSTOMERS_READ',
    'MERCHANTS_READ',
    'AUDIT_LOGS_READ'
  ],

  READONLY_AUDITOR: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'ORDERS_READ',
    'REFUNDS_READ',
    'PRODUCTS_READ',
    'CATEGORIES_READ',
    'CUSTOMERS_READ',
    'MERCHANTS_READ',
    'AUDIT_LOGS_READ',
    'AUDIT_LOGS_EXPORT'
  ]
}

export = {
  async up(queryInterface: QueryInterface) {
    const [roles, perms] = await Promise.all([
      queryInterface.sequelize.query(
        `SELECT id, slug FROM ADMIN_ROLES WHERE deleted_at IS NULL`,
        { type: QueryTypes.SELECT }
      ),
      queryInterface.sequelize.query(
        `SELECT id, slug FROM ADMIN_PERMISSIONS WHERE deleted_at IS NULL`,
        { type: QueryTypes.SELECT }
      )
    ])

    const roleBySlug = new Map<string, number>()
    for (const r of roles as Array<{ id: number; slug: string }>) {
      roleBySlug.set(r.slug, r.id)
    }

    const permBySlug = new Map<string, number>()
    for (const p of perms as Array<{ id: number; slug: string }>) {
      permBySlug.set(p.slug, p.id)
    }

    const now = new Date()
    const rows: Array<Record<string, unknown>> = []

    for (const [roleSlug, permSlugs] of Object.entries(MATRIX)) {
      const roleId = roleBySlug.get(roleSlug)
      if (!roleId) continue

      for (const slug of permSlugs) {
        const permId = permBySlug.get(slug)
        if (!permId) continue

        rows.push({
          role_id: roleId,
          permission_id: permId,
          condition_override_json: null,
          created_at: now,
          updated_at: now,
          deleted_at: null
        })
      }
    }

    if (rows.length > 0) {
      await queryInterface.bulkInsert('ADMIN_ROLE_PERMISSIONS', rows, {})
    }
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('ADMIN_ROLE_PERMISSIONS', {}, {})
  }
}
