import { AdminPermission, AdminRole, AdminRolePermission } from "@digishop/db";

export class AdminRoleRepository {
  async findAndCountRoles(where: any, orderBy: any, offset: number, limit: number, attributes: any, group: any) {
    return AdminRole.findAndCountAll({
      where,
      include: [{ model: AdminRolePermission, as: "rolePermissions", attributes: [], required: false }],
      attributes,
      group,
      order: orderBy,
      offset,
      limit,
      distinct: true,
      subQuery: false,
    });
  }

  async findRoleById(id: number) {
    return AdminRole.findOne({
      where: { id },
      attributes: [
        "id",
        ["slug", "slug"],
        ["name", "name"],
        ["description", "description"],
        ["is_system", "isSystem"],
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
      ],
      include: [
        {
          model: AdminPermission,
          as: "permissions",
          through: { attributes: [] },
          attributes: ["id", "slug", "resource", "action", "effect"],
          required: false,
        },
      ],
    });
  }

  async findAllPermissions() {
    return AdminPermission.findAll({
      attributes: ["id", "slug", "resource", "action", "effect"],
      order: [["resource", "ASC"], ["action", "ASC"]],
    });
  }

  async countRolesBySlug(slug: string) {
    return AdminRole.count({ where: { slug } });
  }

  async createRole(payload: any) {
    return AdminRole.create(payload);
  }

  async findSimpleRoleById(id: number) {
    return AdminRole.findOne({ where: { id } });
  }

  async findPermissionsByIds(ids: number[]) {
    return AdminPermission.findAll({ where: { id: ids } });
  }

  async findPermissionsBySlugs(slugs: string[]) {
    return AdminPermission.findAll({ where: { slug: slugs } });
  }

  async destroyRolePermissions(roleId: number) {
    return AdminRolePermission.destroy({ where: { roleId } });
  }

  async bulkCreateRolePermissions(payload: any[]) {
    return AdminRolePermission.bulkCreate(payload);
  }
}

export const adminRoleRepository = new AdminRoleRepository();
