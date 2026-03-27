import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { AdminUserStatus } from '../../types/portal' // ACTIVE | SUSPENDED

export interface AdminUserAttributes {
  id: number
  uuid?: string | null
  email: string
  name: string
  password?: string // bcrypt hash
  status: AdminUserStatus // ACTIVE|SUSPENDED
  lastLoginAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface AdminUserCreationAttributes
  extends Optional<
    AdminUserAttributes,
    | 'id'
    | 'uuid'
    | 'status'
    | 'lastLoginAt'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class AdminUser
  extends Model<AdminUserAttributes, AdminUserCreationAttributes>
  implements AdminUserAttributes
{
  public id!: number
  public uuid!: string | null
  public email!: string
  public name!: string
  public password!: string
  public status!: AdminUserStatus
  public lastLoginAt!: Date | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof AdminUser {
    AdminUser.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: {
          type: DataTypes.STRING(36),
          allowNull: true,
          unique: false
        },
        email: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: true // unique, indexed
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        password: {
          type: DataTypes.STRING(191),
          allowNull: true // bcrypt hash
        },
        status: {
          type: DataTypes.ENUM(...Object.values(AdminUserStatus)),
          allowNull: false,
          defaultValue: AdminUserStatus.ACTIVE
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_login_at'
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
        tableName: 'ADMIN_USERS',
        modelName: 'AdminUser',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [{ fields: ['email'] }]
      }
    )
    return AdminUser
  }
}
