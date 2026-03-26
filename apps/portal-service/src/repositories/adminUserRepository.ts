import { AdminInvite, AdminPermission, AdminRole, AdminSession, AdminUser, AdminUserRole } from "@digishop/db";
import { Op, col, fn, WhereOptions } from "sequelize";

export class AdminUserRepository {
  async findAndCountAdmins(where: WhereOptions, rolesInclude: any, orderBy: any, offset: number, limit: number) {
    return AdminUser.findAndCountAll({
      where,
      include: [rolesInclude],
      attributes: [
        "id",
        ["email", "email"],
        ["name", "name"],
        ["status", "status"],
        ["last_login_at", "lastLoginAt"],
        ["created_at", "createdAt"]
      ],
      order: orderBy,
      offset,
      limit,
      distinct: true,
      subQuery: false
    });
  }

  async suggestAdmins(t: string) {
    return AdminUser.findAll({
      where: { [Op.or]: [{ email: { [Op.like]: t } }, { name: { [Op.like]: t } }] },
      attributes: ["id", "name", "email"],
      order: [["created_at", "DESC"]],
      limit: 8
    });
  }

  async findAdminDetail(id: number) {
    return AdminUser.findOne({
      where: { id },
      include: [
        {
          model: AdminRole,
          as: "roles",
          attributes: ["id", "slug", "name", "description", "isSystem"],
          required: false,
          through: {
            attributes: ["endAt"],
          },
          include: [
            {
              model: AdminPermission,
              as: "permissions",
              through: { attributes: [] },
              attributes: ["id", "slug", "resource", "action", "effect"],
              required: false
            }
          ]
        },
        {
          model: AdminSession,
          as: "sessions",
          attributes: [
            "id",
            ["jti", "jti"],
            ["ip", "ip"],
            ["user_agent", "userAgent"],
            ["expires_at", "expiresAt"],
            ["revoked_at", "revokedAt"],
            ["created_at", "createdAt"]
          ],
          required: false
        }
      ],
      attributes: [
        "id",
        "email",
        "password",
        "name",
        "status",
        "lastLoginAt",
        "createdAt",
        "updatedAt"
      ]
    });
  }

  async findRoleHistory(adminId: number) {
    return AdminUserRole.findAll({
      where: { adminId },
      paranoid: false,
      include: [
        {
          model: AdminRole,
          as: "role",
          attributes: ["id", "slug", "name"]
        }
      ],
      attributes: [
        "id",
        ["start_at", "startAt"],
        ["end_at", "endAt"],
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
        ["deleted_at", "deletedAt"]
      ] as any,
      order: [["created_at", "DESC"]]
    });
  }

  async findRecentInvite(email: string) {
    return AdminInvite.findOne({
      where: {
        email,
        acceptedAt: { [Op.is]: null },
        deletedAt: { [Op.is]: null },
      },
      order: [["created_at", "DESC"]],
    });
  }

  async countAdminByEmail(email: string) {
    return AdminUser.count({ where: { email } });
  }

  async createAdmin(payload: any) {
    return AdminUser.create(payload);
  }

  async findRoleBySlug(slug: string) {
    return AdminRole.findOne({ where: { slug } });
  }

  async createUserRole(adminId: number, roleId: number) {
    return AdminUserRole.create({ adminId, roleId });
  }
}

export const adminUserRepository = new AdminUserRepository();
