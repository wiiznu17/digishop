import { Model, DataTypes, Optional, Sequelize } from 'sequelize'

export interface AdminApiKeyAttributes {
  id: number
  uuid?: string | null
  adminId: number
  name: string
  keyId?: string | null // สำหรับ prefix ak_live_<keyId>
  keyHash: string
  scopesJson?: object | null
  lastUsedAt?: Date | null
  expiresAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface AdminApiKeyCreationAttributes
  extends Optional<
    AdminApiKeyAttributes,
    | 'id'
    | 'uuid'
    | 'keyId'
    | 'scopesJson'
    | 'lastUsedAt'
    | 'expiresAt'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class AdminApiKey
  extends Model<AdminApiKeyAttributes, AdminApiKeyCreationAttributes>
  implements AdminApiKeyAttributes
{
  public id!: number
  public uuid!: string | null
  public adminId!: number
  public name!: string
  public keyId!: string | null
  public keyHash!: string
  public scopesJson!: object | null
  public lastUsedAt!: Date | null
  public expiresAt!: Date | null
  public createdAt!: Date
  public updatedAt!: Date
  public deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof AdminApiKey {
    AdminApiKey.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: { type: DataTypes.STRING(36), allowNull: true },
        adminId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'admin_id'
        },
        name: { type: DataTypes.STRING(191), allowNull: false },
        keyId: { type: DataTypes.STRING(64), allowNull: true, field: 'key_id' },
        keyHash: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'key_hash'
        },
        scopesJson: {
          type: DataTypes.JSON,
          allowNull: true,
          field: 'scopes_json'
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_used_at'
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'expires_at'
        },
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
        tableName: 'ADMIN_API_KEYS',
        modelName: 'AdminApiKey',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['admin_id'] },
          { fields: ['key_id'] },
          { unique: true, fields: ['key_hash'] }
        ]
      }
    )
    return AdminApiKey
  }
}
