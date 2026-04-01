import {
  Model,
  DataTypes,
  Optional,
  Sequelize,
  Association,
  HasManyGetAssociationsMixin
} from 'sequelize'
import { UserRole } from '../types/enum'

export interface UserAttributes {
  id: number
  email: string
  password: string
  firstName: string
  lastName: string
  middleName: string
  role: UserRole
  googleId: string | null
  createdAt?: Date // managed by sequelize
  updatedAt?: Date // mapped to edit_at in DB
}

export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    'id' | 'middleName' | 'createdAt' | 'updatedAt'
  > {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number
  public email!: string
  public password!: string
  public firstName!: string
  public lastName!: string
  public middleName!: string
  public role!: UserRole
  public googleId!: string | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date // column edit_at

  // example mixins
  public getAddresses!: HasManyGetAssociationsMixin<any>

  public static associations: {
    addresses: Association<User, any>
  }

  static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        email: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: true
        },
        password: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        firstName: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'first_name'
        },
        lastName: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'last_name'
        },
        middleName: {
          type: DataTypes.STRING(191),
          allowNull: true,
          field: 'middle_name'
        },
        role: {
          type: DataTypes.ENUM(...Object.values(UserRole)),
          allowNull: false,
          defaultValue: UserRole.CUSTOMER
        },
        googleId: {
          type: DataTypes.STRING(191),
          allowNull: true,
          unique: true,
          field: 'google_id'
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
          // ER used edit_at
          field: 'updated_at',
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        tableName: 'USERS',
        modelName: 'User',
        paranoid: true, // เปิด soft delete
        deletedAt: 'deleted_at' // ชื่อคอลัมน์ soft delete
      }
    )
    return User
  }
}
