import { QueryInterface, DataTypes } from 'sequelize'
import { UserRole } from '../types/enum'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'USERS',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
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
        first_name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        last_name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        middle_name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        role: {
          type: DataTypes.ENUM(...Object.values(UserRole)),
          allowNull: false,
          defaultValue: UserRole.CUSTOMER
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          // per ER; acts as updated_at
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    )
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('USERS')
  }
}
