import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface AdminRolePermissionAttributes {
  id: number;
  roleId: number;
  permissionId: number;
  conditionOverrideJson?: object | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AdminRolePermissionCreationAttributes
  extends Optional<AdminRolePermissionAttributes, "id" | "conditionOverrideJson" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class AdminRolePermission extends Model<AdminRolePermissionAttributes, AdminRolePermissionCreationAttributes>
  implements AdminRolePermissionAttributes {
  public id!: number;
  public roleId!: number;
  public permissionId!: number;
  public conditionOverrideJson!: object | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof AdminRolePermission {
    AdminRolePermission.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "role_id" },
        permissionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "permission_id" },
        conditionOverrideJson: { type: DataTypes.JSON, allowNull: true, field: "condition_override_json" },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "ADMIN_ROLE_PERMISSIONS",
        modelName: "AdminRolePermission",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ unique: true, fields: ["role_id", "permission_id"] }],
      }
    );
    return AdminRolePermission;
  }
}
