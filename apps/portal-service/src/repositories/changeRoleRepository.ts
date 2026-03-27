import { AdminRole, AdminUser, AdminUserRole } from '@digishop/db'

export class ChangeRoleRepository {
  async findAllAdminRoles() {
    return AdminRole.findAll({
      attributes: ['id', 'slug', 'name', 'description', 'isSystem'],
      order: [['slug', 'ASC']]
    })
  }

  async findAdminUserById(id: number) {
    return AdminUser.findByPk(id)
  }

  async findRolesBySlugs(roleSlugs: string[]) {
    return AdminRole.findAll({ where: { slug: roleSlugs } as any })
  }

  async findAllAdminUserRolesActive(adminId: number, transaction: any) {
    return AdminUserRole.findAll({
      where: { adminId },
      paranoid: false,
      transaction
    })
  }

  async createAdminUserRole(payload: any, transaction: any) {
    return AdminUserRole.create(payload, { transaction })
  }
}

export const changeRoleRepository = new ChangeRoleRepository()
