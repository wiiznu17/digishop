import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface AdminSessionAttributes {
  id: number;
  uuid?: string | null;
  adminId: number;
  jti: string;
  refreshTokenHash?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface AdminSessionCreationAttributes
  extends Optional<AdminSessionAttributes, "id" | "uuid" | "refreshTokenHash" | "ip" | "userAgent" | "revokedAt" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class AdminSession extends Model<AdminSessionAttributes, AdminSessionCreationAttributes>
  implements AdminSessionAttributes {
  public id!: number;
  public uuid!: string | null;
  public adminId!: number;
  public jti!: string;
  public refreshTokenHash!: string | null;
  public ip!: string | null;
  public userAgent!: string | null;
  public expiresAt!: Date;
  public revokedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof AdminSession {
    AdminSession.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.STRING(36), allowNull: true, unique: false },
        adminId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "admin_id" },
        jti: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        refreshTokenHash: { type: DataTypes.STRING(191), allowNull: true, field: "refresh_token_hash" },
        ip: { type: DataTypes.STRING(64), allowNull: true },
        userAgent: { type: DataTypes.STRING(255), allowNull: true, field: "user_agent" },
        expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
        revokedAt: { type: DataTypes.DATE, allowNull: true, field: "revoked_at" },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "ADMIN_SESSIONS",
        modelName: "AdminSession",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ fields: ["admin_id"] }, { unique: true, fields: ["jti"] }],
      }
    );
    return AdminSession;
  }
}
