import { QueryInterface, DataTypes } from 'sequelize'
import { StoreStatus } from '../types/enum'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'STORES',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        uuid: { type: DataTypes.STRING(36), allowNull: false },

        user_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          unique: true,
          references: { model: 'USERS', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },

        store_name: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: true
        },
        email: { type: DataTypes.STRING(191), allowNull: false },
        phone: { type: DataTypes.STRING(191), allowNull: true },
        business_type: { type: DataTypes.STRING(191), allowNull: false },
        website: {
          type: DataTypes.STRING(191),
          allowNull: true,
          defaultValue: '-'
        },
        logo_url: { type: DataTypes.STRING(255), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },

        status: {
          type: DataTypes.ENUM(...Object.values(StoreStatus)),
          allowNull: false,
          defaultValue: StoreStatus.PENDING
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        deleted_at: { type: DataTypes.DATE, allowNull: true }
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    )

    await queryInterface.addIndex('STORES', ['uuid'], {
      unique: true,
      name: 'uq_stores_uuid'
    })
    await queryInterface.addIndex('STORES', ['user_id'], {
      unique: true,
      name: 'uq_stores_user_id'
    })
    await queryInterface.addIndex('STORES', ['status'], {
      name: 'ix_stores_status'
    })
    await queryInterface.addIndex('STORES', ['created_at'], {
      name: 'ix_stores_created_at'
    })
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('STORES')
  }
}
