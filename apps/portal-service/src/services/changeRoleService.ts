import { sequelize } from '@digishop/db'
import { Transaction } from 'sequelize'
import { AppError, BadRequestError, NotFoundError } from '../errors/AppError'
import { changeRoleRepository } from '../repositories/changeRoleRepository'

export class ChangeRoleService {
  async listRoles() {
    const rows = await changeRoleRepository.findAllAdminRoles()
    return rows.map((r: any) => ({
      id: r.get('id'),
      slug: r.get('slug'),
      name: r.get('name'),
      description: r.get('description'),
      isSystem: !!r.get('isSystem')
    }))
  }

  async updateAdminRoles(
    id: number,
    payload: any,
    requesterRoleSlugs: string[]
  ) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')

    const admin = await changeRoleRepository.findAdminUserById(id)
    if (!admin) throw new NotFoundError('Admin not found')

    const roleSlugs = Array.isArray(payload?.roleSlugs)
      ? (payload.roleSlugs as string[])
      : []
    if (roleSlugs.length === 0)
      throw new BadRequestError('roleSlugs must not be empty')

    const wantsSuperAdmin = roleSlugs.includes('SUPER_ADMIN')
    const isRequesterSuperAdmin = requesterRoleSlugs.includes('SUPER_ADMIN')
    if (wantsSuperAdmin && !isRequesterSuperAdmin) {
      throw new AppError('FORBIDDEN_SUPER_ADMIN_ASSIGN', 403)
    }

    const roles = await changeRoleRepository.findRolesBySlugs(roleSlugs)
    const found = new Set(roles.map((r: any) => String(r.get('slug'))))
    const missing = roleSlugs.filter((s) => !found.has(s))
    if (missing.length) throw new BadRequestError('INVALID_ROLE_SLUGS')

    const wantRoleIds = new Set<number>(
      roles.map((r: any) => r.get('id') as number)
    )
    const now = new Date()

    await sequelize.transaction(async (t: Transaction) => {
      const allRows = await changeRoleRepository.findAllAdminUserRolesActive(
        id,
        t
      )

      const activeByRoleId = new Map<number, any>()
      for (const row of allRows as any[]) {
        const rid = row.get('roleId') as number
        const endAt = row.get('endAt') as Date | null
        const deletedAt = row.get('deletedAt') as Date | null
        if (!endAt && !deletedAt) activeByRoleId.set(rid, row)
      }

      for (const [rid, row] of activeByRoleId) {
        if (!wantRoleIds.has(rid)) {
          await row.update({ endAt: now }, { transaction: t })
        }
      }

      for (const rid of wantRoleIds) {
        if (activeByRoleId.has(rid)) continue
        await changeRoleRepository.createAdminUserRole(
          { adminId: id, roleId: rid, startAt: now, endAt: null },
          t
        )
      }
    })

    return { ok: true }
  }
}

export const changeRoleService = new ChangeRoleService()
