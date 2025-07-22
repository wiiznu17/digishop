import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { AdminRole } from '../../types/enum';

export interface AdminUserAttributes {
  id: number;
  email: string;
  name: string;
  password: string;
  role: AdminRole;
  createdAt?: Date; // managed by sequelize
  updatedAt?: Date; // mapped to edit_at in DB
}

export interface AdminUserCreationAttributes extends Optional<AdminUserAttributes, 'id' | 'role'> {}

export class AdminUser extends Model<AdminUserAttributes, AdminUserCreationAttributes> implements AdminUserAttributes {
  public id!: number;
  public email!: string;
  public name!: string;
  public password!: string;
  public role!: AdminRole;

  static initModel(sequelize: Sequelize): typeof AdminUser {
    AdminUser.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM(...Object.values(AdminRole)),
          allowNull: false,
          defaultValue: AdminRole.ADMIN,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          // ER used edit_at
          field: 'updated_at',
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'ADMIN_USERS',
        modelName: 'AdminUser',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return AdminUser;
  }
}