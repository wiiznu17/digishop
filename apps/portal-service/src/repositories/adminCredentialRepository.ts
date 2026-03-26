import { AdminInvite, AdminPasswordReset, AdminRole, AdminUser, AdminUserRole } from "@digishop/db";
import { Op } from "sequelize";

export class AdminCredentialRepository {
  async findAdminById(id: number) {
    return AdminUser.findByPk(id);
  }

  async findRecentUnacceptedInvite(email: string, cooldownSince: Date) {
    return AdminInvite.findOne({
      where: {
        email,
        acceptedAt: { [Op.is]: null },
        deletedAt: { [Op.is]: null },
        createdAt: { [Op.gte]: cooldownSince }
      }
    });
  }

  async clearPendingInvites(email: string) {
    return AdminInvite.update(
      { deletedAt: new Date() },
      { where: { email, acceptedAt: null, deletedAt: { [Op.is]: null } }, paranoid: false }
    );
  }

  async findUserRolesByAdminId(adminId: number) {
    return AdminUserRole.findAll({ where: { adminId } });
  }

  async findRoleById(id: number) {
    return AdminRole.findByPk(id);
  }

  async createInvite(payload: any) {
    return AdminInvite.create(payload);
  }

  async clearPendingResets(adminId: number) {
    return AdminPasswordReset.update(
      { deletedAt: new Date() },
      { where: { adminId, usedAt: null, deletedAt: { [Op.is]: null } }, paranoid: false }
    );
  }

  async createPasswordReset(payload: any) {
    return AdminPasswordReset.create(payload);
  }

  async findInviteByTokenHash(tokenHash: string) {
    return AdminInvite.findOne({ where: { tokenHash } });
  }

  async findAdminByEmailIncludeDeleted(email: string) {
    return AdminUser.findOne({ where: { email }, paranoid: false });
  }

  async createAdmin(payload: any) {
    return AdminUser.create(payload);
  }

  async findRoleBySlug(slug: string) {
    return AdminRole.findOne({ where: { slug } });
  }

  async findOrCreateUserRole(adminId: number, roleId: number) {
    return AdminUserRole.findOrCreate({
      where: { adminId, roleId },
      defaults: { adminId, roleId }
    });
  }

  async findResetByTokenHash(tokenHash: string) {
    return AdminPasswordReset.findOne({ where: { tokenHash } });
  }
}

export const adminCredentialRepository = new AdminCredentialRepository();
