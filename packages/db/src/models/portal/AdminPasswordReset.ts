import { Model, DataTypes, Optional, Sequelize } from 'sequelize'

export interface AdminPasswordResetAttributes {
  id: number
  adminId: number
  tokenHash: string
  expiresAt: Date
  usedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface AdminPasswordResetCreationAttributes
  extends Optional<
    AdminPasswordResetAttributes,
    'id' | 'usedAt' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

export class AdminPasswordReset
  extends Model<
    AdminPasswordResetAttributes,
    AdminPasswordResetCreationAttributes
  >
  implements AdminPasswordResetAttributes
{
  public id!: number
  public adminId!: number
  public tokenHash!: string
  public expiresAt!: Date
  public usedAt!: Date | null
  public createdAt!: Date
  public updatedAt!: Date
  public deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof AdminPasswordReset {
    AdminPasswordReset.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        adminId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'admin_id'
        },
        tokenHash: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'token_hash'
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at'
        },
        usedAt: { type: DataTypes.DATE, allowNull: true, field: 'used_at' },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: DataTypes.NOW
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at'
        }
      },
      {
        sequelize,
        tableName: 'ADMIN_PASSWORD_RESETS',
        modelName: 'AdminPasswordReset',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [{ fields: ['admin_id'] }, { fields: ['token_hash'] }]
      }
    )
    return AdminPasswordReset
  }
}
