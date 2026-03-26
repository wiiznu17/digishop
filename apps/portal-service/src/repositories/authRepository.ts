import { AdminPermission, AdminRole, AdminSession, AdminUser } from "@digishop/db";

export class AuthRepository {
  async findAdminByEmail(email: string) {
    return AdminUser.findOne({ where: { email } as any });
  }

  async findAdminById(id: number) {
    return AdminUser.findByPk(id, {
      attributes: ["id", "email"],
      include: [
        {
          model: AdminRole,
          as: "roles",
          attributes: ["slug"],
          through: { attributes: [] },
          include: [
            {
              model: AdminPermission,
              as: "permissions",
              attributes: ["slug"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });
  }

  async createAdminSession(adminId: number, jti: string, ip: string, userAgent: string | null, expiresAt: Date) {
    return AdminSession.create({
      adminId,
      jti,
      ip,
      userAgent,
      expiresAt,
    } as any);
  }

  async findActiveSession(adminId: number, jti: string) {
    return AdminSession.findOne({
      where: { adminId, jti, revokedAt: null } as any,
    });
  }

  async revokeSession(sess: any) {
    return sess.update({ revokedAt: new Date() } as any);
  }

  async revokeSessionByCriteria(adminId: number, jti: string) {
    return AdminSession.update(
      { revokedAt: new Date() } as any,
      { where: { adminId, jti } }
    );
  }
}

export const authRepository = new AuthRepository();
