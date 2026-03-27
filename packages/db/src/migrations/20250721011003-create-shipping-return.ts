import { QueryInterface, DataTypes, Sequelize } from 'sequelize'
import { ReturnShipmentStatus } from '../types/enum'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'RETURN_SHIPMENTS',
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

        refund_order_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'REFUND_ORDERS', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },

        carrier: {
          type: DataTypes.STRING(100),
          allowNull: true
        },

        tracking_number: {
          type: DataTypes.STRING(100),
          allowNull: true
          // unique: true,
        },

        status: {
          type: DataTypes.ENUM(...Object.values(ReturnShipmentStatus)),
          allowNull: false,
          defaultValue: ReturnShipmentStatus.AWAITING_DROP
        },

        deadline_dropoff_at: {
          type: DataTypes.DATE,
          allowNull: false
        },

        shipped_at: {
          type: DataTypes.DATE,
          allowNull: true
        },

        delivered_back_at: {
          type: DataTypes.DATE,
          allowNull: true
        },

        from_address_snapshot: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null
        },

        to_address_snapshot: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null
        },

        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
          )
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

    await queryInterface.addIndex('RETURN_SHIPMENTS', ['order_id'])
    await queryInterface.addIndex('RETURN_SHIPMENTS', ['refund_order_id'])
    await queryInterface.addIndex('RETURN_SHIPMENTS', ['status'])
    await queryInterface.addIndex('RETURN_SHIPMENTS', ['tracking_number'])
    await queryInterface.addIndex('RETURN_SHIPMENTS', ['created_at'])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('RETURN_SHIPMENTS')
  }
}
