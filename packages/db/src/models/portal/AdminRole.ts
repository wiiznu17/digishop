import { Model, DataTypes, Optional, Sequelize } from 'sequelize'

export interface AdminRoleAttributes {
  id: number
  uuid?: string | null
  slug: string
  name: string
  description?: string | null
  isSystem: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface AdminRoleCreationAttributes
  extends Optional<
    AdminRoleAttributes,
    | 'id'
    | 'uuid'
    | 'description'
    | 'isSystem'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class AdminRole
  extends Model<AdminRoleAttributes, AdminRoleCreationAttributes>
  implements AdminRoleAttributes
{
  public id!: number
  public uuid!: string | null
  public slug!: string
  public name!: string
  public description!: string | null
  public isSystem!: boolean
  public createdAt!: Date
  public updatedAt!: Date
  public deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof AdminRole {
    AdminRole.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: { type: DataTypes.STRING(36), allowNull: true },
        slug: { type: DataTypes.STRING(128), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(191), allowNull: false },
        description: { type: DataTypes.STRING(255), allowNull: true },
        isSystem: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          field: 'is_system',
          defaultValue: false
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
        tableName: 'ADMIN_ROLES',
        modelName: 'AdminRole',
        paranoid: true,
        deletedAt: 'deleted_at'
      }
    )
    return AdminRole
  }
}
