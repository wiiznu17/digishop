import type { QueryInterface } from 'sequelize'

type Perm = { resource: string; action: string; slug: string }

const PERMISSIONS: Perm[] = [
  // Dashboard
  { resource: 'DASHBOARD', action: 'VIEW', slug: 'DASHBOARD_VIEW' },

  // Analytics
  { resource: 'ANALYTICS', action: 'VIEW', slug: 'ANALYTICS_VIEW' },
  { resource: 'ANALYTICS', action: 'EXPORT', slug: 'ANALYTICS_EXPORT' },

  // Orders
  { resource: 'ORDERS', action: 'READ', slug: 'ORDERS_READ' },
  { resource: 'ORDERS', action: 'EXPORT', slug: 'ORDERS_EXPORT' },

  // Refunds
  { resource: 'REFUNDS', action: 'READ', slug: 'REFUNDS_READ' },
  { resource: 'REFUNDS', action: 'EXPORT', slug: 'REFUNDS_EXPORT' },

  // Products
  { resource: 'PRODUCTS', action: 'READ', slug: 'PRODUCTS_READ' },
  { resource: 'PRODUCTS', action: 'UPDATE', slug: 'PRODUCTS_UPDATE' },

  // Categories
  { resource: 'CATEGORIES', action: 'READ', slug: 'CATEGORIES_READ' },
  { resource: 'CATEGORIES', action: 'CREATE', slug: 'CATEGORIES_CREATE' },
  { resource: 'CATEGORIES', action: 'UPDATE', slug: 'CATEGORIES_UPDATE' },
  { resource: 'CATEGORIES', action: 'DELETE', slug: 'CATEGORIES_DELETE' },

  // Customers
  { resource: 'CUSTOMERS', action: 'READ', slug: 'CUSTOMERS_READ' },
  { resource: 'CUSTOMERS', action: 'SUSPEND', slug: 'CUSTOMERS_SUSPEND' },

  // Merchants
  { resource: 'MERCHANTS', action: 'READ', slug: 'MERCHANTS_READ' },
  { resource: 'MERCHANTS', action: 'APPROVE', slug: 'MERCHANTS_APPROVE' },
  { resource: 'MERCHANTS', action: 'SUSPEND', slug: 'MERCHANTS_SUSPEND' },

  // Admin Users
  { resource: 'ADMIN_USERS', action: 'READ', slug: 'ADMIN_USERS_READ' },
  { resource: 'ADMIN_USERS', action: 'CREATE', slug: 'ADMIN_USERS_CREATE' },
  { resource: 'ADMIN_USERS', action: 'UPDATE', slug: 'ADMIN_USERS_UPDATE' },
  { resource: 'ADMIN_USERS', action: 'DELETE', slug: 'ADMIN_USERS_DELETE' },

  // Roles
  { resource: 'ROLES', action: 'READ', slug: 'ROLES_READ' },
  { resource: 'ROLES', action: 'CREATE', slug: 'ROLES_CREATE' },
  { resource: 'ROLES', action: 'UPDATE', slug: 'ROLES_UPDATE' },
  { resource: 'ROLES', action: 'DELETE', slug: 'ROLES_DELETE' },
  { resource: 'ROLES', action: 'ASSIGN', slug: 'ROLES_ASSIGN' },

  // Audit Logs
  { resource: 'AUDIT_LOGS', action: 'READ', slug: 'AUDIT_LOGS_READ' },
  { resource: 'AUDIT_LOGS', action: 'EXPORT', slug: 'AUDIT_LOGS_EXPORT' }
]

export = {
  async up(queryInterface: QueryInterface) {
    const now = new Date()
    await queryInterface.bulkInsert(
      'ADMIN_PERMISSIONS',
      PERMISSIONS.map((p) => ({
        resource: p.resource,
        action: p.action,
        effect: 'ALLOW',
        condition_json: null,
        slug: p.slug,
        created_at: now,
        updated_at: now,
        deleted_at: null
      })),
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('ADMIN_PERMISSIONS', {}, {})
  }
}
