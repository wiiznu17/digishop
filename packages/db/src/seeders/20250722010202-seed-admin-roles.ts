import type { QueryInterface } from 'sequelize'

type RoleSeed = {
  slug: string
  name: string
  description?: string | null
  is_system: boolean
}

const ROLES: RoleSeed[] = [
  {
    slug: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full access',
    is_system: true
  },
  {
    slug: 'PLATFORM_ADMIN',
    name: 'Platform Admin',
    description: 'Ops across modules (no RBAC)',
    is_system: true
  },
  {
    slug: 'RBAC_ADMIN',
    name: 'RBAC Admin',
    description: 'Manage admin users/roles/permissions',
    is_system: true
  },
  {
    slug: 'OPERATIONS_MANAGER',
    name: 'Operations Manager',
    description: 'Orders/Refunds ops',
    is_system: false
  },
  {
    slug: 'CATALOG_MANAGER',
    name: 'Catalog Manager',
    description: 'Products/Categories owner',
    is_system: false
  },
  {
    slug: 'MERCHANT_OPERATIONS',
    name: 'Merchant Ops',
    description: 'Merchant KYC/approve/suspend',
    is_system: false
  },
  {
    slug: 'SUPPORT_AGENT',
    name: 'Support Agent',
    description: 'Read-only + limited actions',
    is_system: false
  },
  {
    slug: 'ANALYST',
    name: 'Analyst',
    description: 'Analytics view/export',
    is_system: false
  },
  {
    slug: 'READONLY_AUDITOR',
    name: 'Read-only Auditor',
    description: 'Wide read + audit logs',
    is_system: false
  }
]

export = {
  async up(queryInterface: QueryInterface) {
    const now = new Date()
    await queryInterface.bulkInsert(
      'ADMIN_ROLES',
      ROLES.map((r) => ({
        uuid: null,
        slug: r.slug,
        name: r.name,
        description: r.description ?? null,
        is_system: r.is_system,
        created_at: now,
        updated_at: now,
        deleted_at: null
      })),
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('ADMIN_ROLES', {}, {})
  }
}
