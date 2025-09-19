import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { PermissionEffect } from "../../types/portal";

export interface AdminPermissionAttributes {
  id: number;
  uuid?: string | null;
  resource: string;   // e.g., ORDER, REFUND, PRODUCT
  action: string;     // e.g., READ, UPDATE, APPROVE
  effect: PermissionEffect;
  conditionJson?: object | null;
  slug: string;       // e.g., ORDER.READ
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AdminPermissionCreationAttributes
  extends Optional<AdminPermissionAttributes, "id" | "uuid" | "conditionJson" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class AdminPermission extends Model<AdminPermissionAttributes, AdminPermissionCreationAttributes>
  implements AdminPermissionAttributes {
  public id!: number;
  public uuid!: string | null;
  public resource!: string;
  public action!: string;
  public effect!: PermissionEffect;
  public conditionJson!: object | null;
  public slug!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof AdminPermission {
    AdminPermission.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.STRING(36), allowNull: true },
        resource: { type: DataTypes.STRING(64), allowNull: false },
        action: { type: DataTypes.STRING(64), allowNull: false },
        effect: { type: DataTypes.ENUM(...Object.values(PermissionEffect)), allowNull: false, defaultValue: PermissionEffect.ALLOW },
        conditionJson: { type: DataTypes.JSON, allowNull: true, field: "condition_json" },
        slug: { type: DataTypes.STRING(128), allowNull: false, unique: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "ADMIN_PERMISSIONS",
        modelName: "AdminPermission",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ fields: ["resource", "action"] }],
      }
    );
    return AdminPermission;
  }
}
