import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface AdminRecoveryCodeAttributes {
  id: number;
  adminId: number;
  codeHash: string;
  status: "UNUSED" | "USED";
  usedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AdminRecoveryCodeCreationAttributes
  extends Optional<AdminRecoveryCodeAttributes, "id" | "usedAt" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class AdminRecoveryCode extends Model<AdminRecoveryCodeAttributes, AdminRecoveryCodeCreationAttributes>
  implements AdminRecoveryCodeAttributes {
  public id!: number;
  public adminId!: number;
  public codeHash!: string;
  public status!: "UNUSED" | "USED";
  public usedAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof AdminRecoveryCode {
    AdminRecoveryCode.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        adminId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "admin_id" },
        codeHash: { type: DataTypes.STRING(191), allowNull: false, field: "code_hash" },
        status: { type: DataTypes.ENUM("UNUSED", "USED"), allowNull: false, defaultValue: "UNUSED" },
        usedAt: { type: DataTypes.DATE, allowNull: true, field: "used_at" },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "ADMIN_RECOVERY_CODES",
        modelName: "AdminRecoveryCode",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ fields: ["admin_id"] }],
      }
    );
    return AdminRecoveryCode;
  }
}
