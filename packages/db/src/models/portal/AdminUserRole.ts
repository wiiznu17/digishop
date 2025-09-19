import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface AdminUserRoleAttributes {
  id: number;
  adminId: number;
  roleId: number;
  startAt?: Date | null;
  endAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AdminUserRoleCreationAttributes
  extends Optional<AdminUserRoleAttributes, "id" | "startAt" | "endAt" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class AdminUserRole extends Model<AdminUserRoleAttributes, AdminUserRoleCreationAttributes>
  implements AdminUserRoleAttributes {
  public id!: number;
  public adminId!: number;
  public roleId!: number;
  public startAt!: Date | null;
  public endAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof AdminUserRole {
    AdminUserRole.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        adminId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "admin_id" },
        roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "role_id" },
        startAt: { type: DataTypes.DATE, allowNull: true, field: "start_at" },
        endAt: { type: DataTypes.DATE, allowNull: true, field: "end_at" },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "ADMIN_USER_ROLES",
        modelName: "AdminUserRole",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ unique: true, fields: ["admin_id", "role_id"] }],
      }
    );
    return AdminUserRole;
  }
}
