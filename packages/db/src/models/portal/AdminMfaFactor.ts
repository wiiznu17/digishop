import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { MfaFactorType, MfaFactorStatus } from "../../types/portal";

export interface AdminMfaFactorAttributes {
  id: number;
  adminId: number;
  type: MfaFactorType;
  secretOrPublic?: string | null; // เข้ารหัสไว้
  label?: string | null;
  status: MfaFactorStatus;
  addedAt: Date;
  lastUsedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AdminMfaFactorCreationAttributes
  extends Optional<AdminMfaFactorAttributes, "id" | "secretOrPublic" | "label" | "lastUsedAt" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class AdminMfaFactor extends Model<AdminMfaFactorAttributes, AdminMfaFactorCreationAttributes>
  implements AdminMfaFactorAttributes {
  public id!: number;
  public adminId!: number;
  public type!: MfaFactorType;
  public secretOrPublic!: string | null;
  public label!: string | null;
  public status!: MfaFactorStatus;
  public addedAt!: Date;
  public lastUsedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof AdminMfaFactor {
    AdminMfaFactor.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        adminId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "admin_id" },
        type: { type: DataTypes.ENUM(...Object.values(MfaFactorType)), allowNull: false },
        secretOrPublic: { type: DataTypes.TEXT, allowNull: true, field: "secret_or_public" },
        label: { type: DataTypes.STRING(191), allowNull: true },
        status: { type: DataTypes.ENUM(...Object.values(MfaFactorStatus)), allowNull: false, defaultValue: MfaFactorStatus.ACTIVE },
        addedAt: { type: DataTypes.DATE, allowNull: false, field: "added_at", defaultValue: DataTypes.NOW },
        lastUsedAt: { type: DataTypes.DATE, allowNull: true, field: "last_used_at" },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "ADMIN_MFA_FACTORS",
        modelName: "AdminMfaFactor",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ fields: ["admin_id"] }, { fields: ["type"] }],
      }
    );
    return AdminMfaFactor;
  }
}
