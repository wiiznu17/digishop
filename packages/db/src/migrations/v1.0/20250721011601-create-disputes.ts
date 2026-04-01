import { QueryInterface, DataTypes } from 'sequelize'
import { DisputeStatus } from '../types/enum'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'DISPUTES',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        order_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'ORDERS', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        customer_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'USERS', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        reason: { type: DataTypes.TEXT, allowNull: false },
        status: {
          type: DataTypes.ENUM(...Object.values(DisputeStatus)),
          allowNull: false,
          defaultValue: DisputeStatus.OPEN
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
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    )
    await queryInterface.addIndex('DISPUTES', ['order_id'])
    await queryInterface.addIndex('DISPUTES', ['customer_id'])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('DISPUTES')
  }
}
