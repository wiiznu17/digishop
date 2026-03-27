import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

// 1. กำหนด interface สำหรับ attribute ของ User
export interface UserAttributes {
  id: number
  name: string
  email: string
}

// 2. กำหนด interface สำหรับสร้าง User (field บางตัวอาจ optional)
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id'> {}

// 3. สร้าง class User ที่ extends Model พร้อมระบุ generic types
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number
  public name!: string
  public email!: string

  // timestamps (ถ้าใช้)
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // กำหนดความสัมพันธ์ (associations) ในนี้ (ถ้ามี)
  static associate(models: any) {
    // example: User.hasMany(models.Post);
  }
}

// 4. ฟังก์ชัน init model
export function initUser(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'Users',
      modelName: 'User'
    }
  )

  return User
}
