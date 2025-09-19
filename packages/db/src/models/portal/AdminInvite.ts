import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface AdminInviteAttributes {
  id: number;
  uuid?: string | null;
  email: string;
  invitedByAdminId: number;
  tokenHash: string;
  roleSlugDefault?: string | null;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AdminInviteCreationAttributes
  extends Optional<AdminInviteAttributes, "id" | "uuid" | "roleSlugDefault" | "acceptedAt" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class AdminInvite extends Model<AdminInviteAttributes, AdminInviteCreationAttributes>
  implements AdminInviteAttributes {
  public id!: number;
  public uuid!: string | null;
  public email!: string;
  public invitedByAdminId!: number;
  public tokenHash!: string;
  public roleSlugDefault!: string | null;
  public expiresAt!: Date;
  public acceptedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof AdminInvite {
    AdminInvite.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.STRING(36), allowNull: true },
        email: { type: DataTypes.STRING(191), allowNull: false },
        invitedByAdminId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "invited_by_admin_id" },
        tokenHash: { type: DataTypes.STRING(191), allowNull: false, field: "token_hash" },
        roleSlugDefault: { type: DataTypes.STRING(128), allowNull: true, field: "role_slug_default" },
        expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
        acceptedAt: { type: DataTypes.DATE, allowNull: true, field: "accepted_at" },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "ADMIN_INVITES",
        modelName: "AdminInvite",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ fields: ["email"] }, { fields: ["token_hash"] }],
      }
    );
    return AdminInvite;
  }
}
