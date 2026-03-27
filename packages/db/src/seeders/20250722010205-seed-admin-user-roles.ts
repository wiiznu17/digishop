import type { QueryInterface } from 'sequelize'
import { QueryTypes } from 'sequelize'

type AdminRow = { id: number; email: string }
type RoleRow = { id: number; slug: string }

export default {
  async up(q: QueryInterface) {
    // ดึงผู้ใช้ที่เราพึ่ง seed
    const admins = await q.sequelize.query<AdminRow>(
      `SELECT id,email FROM ADMIN_USERS
       WHERE email IN (
        'superadmin@example.com',
        'platform@example.com',
        'rbac@example.com',
        'ops@example.com',
        'catalog@example.com',
        'merchantops@example.com',
        'support@example.com',
        'analyst@example.com',
        'auditor@example.com'
       ) AND deleted_at IS NULL`,
      { type: QueryTypes.SELECT }
    )

    // ดึง role ทั้งหมด
    const roles = await q.sequelize.query<RoleRow>(
      `SELECT id,slug FROM ADMIN_ROLES WHERE deleted_at IS NULL`,
      { type: QueryTypes.SELECT }
    )

    const roleIdBySlug = new Map<string, number>()
    roles.forEach((r) => roleIdBySlug.set(r.slug, r.id))

    // mapping: email → role slugs (UPPERCASE ให้ตรงกับที่ seed roles)
    const emailToRoles: Record<string, string[]> = {
      'superadmin@example.com': ['SUPER_ADMIN'], // full access
      'platform@example.com': ['PLATFORM_ADMIN'],
      'rbac@example.com': ['RBAC_ADMIN'],
      'ops@example.com': ['OPERATIONS_MANAGER'],
      'catalog@example.com': ['CATALOG_MANAGER'],
      'merchantops@example.com': ['MERCHANT_OPERATIONS'],
      'support@example.com': ['SUPPORT_AGENT'],
      'analyst@example.com': ['ANALYST'],
      'auditor@example.com': ['READONLY_AUDITOR']
    }

    const now = new Date()
    const rows: Array<{
      admin_id: number
      role_id: number
      start_at: Date | null
      end_at: Date | null
      created_at: Date
      updated_at: Date
      deleted_at: null
    }> = []

    admins.forEach((a) => {
      const slugs = emailToRoles[a.email] || []
      slugs.forEach((slug) => {
        const roleId = roleIdBySlug.get(slug)
        if (roleId) {
          rows.push({
            admin_id: a.id,
            role_id: roleId,
            start_at: now,
            end_at: null,
            created_at: now,
            updated_at: now,
            deleted_at: null
          })
        }
      })
    })

    if (rows.length > 0) {
      await q.bulkInsert('ADMIN_USER_ROLES', rows, {})
    }
  },

  async down(q: QueryInterface) {
    // ลบเฉพาะ mapping ของผู้ใช้กลุ่มนี้
    await q.sequelize.query(
      `
      DELETE ur FROM ADMIN_USER_ROLES ur
      JOIN ADMIN_USERS u ON u.id = ur.admin_id
      WHERE u.email IN (
        'superadmin@example.com',
        'platform@example.com',
        'rbac@example.com',
        'ops@example.com',
        'catalog@example.com',
        'merchantops@example.com',
        'support@example.com',
        'analyst@example.com',
        'auditor@example.com'
      )
      `,
      { type: QueryTypes.DELETE }
    )
  }
}
