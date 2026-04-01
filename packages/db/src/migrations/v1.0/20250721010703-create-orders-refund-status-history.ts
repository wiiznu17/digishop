// src/migrations/2025xxxx-create-refund-status-history.ts
import { QueryInterface, DataTypes, Sequelize } from 'sequelize'
import { ActorType, RefundStatus } from '../../types/enum'

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('REFUND_STATUS_HISTORY', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      refund_order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'REFUND_ORDERS', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      from_status: {
        type: DataTypes.ENUM(...Object.values(RefundStatus)),
        allowNull: true
      },
      to_status: {
        type: DataTypes.ENUM(...Object.values(RefundStatus)),
        allowNull: false
      },

      reason: { type: DataTypes.TEXT, allowNull: true },

      changed_by_type: {
        type: DataTypes.ENUM(...Object.values(ActorType)),
        allowNull: true
      },
      changed_by_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      source: { type: DataTypes.STRING(50), allowNull: true },
      correlation_id: { type: DataTypes.STRING(100), allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },

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
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    })

    await queryInterface.addIndex('REFUND_STATUS_HISTORY', {
      name: 'idx_rsh_refund_order_created',
      fields: ['refund_order_id', 'created_at'],
      using: 'BTREE'
    })
    await queryInterface.addIndex('REFUND_STATUS_HISTORY', {
      name: 'idx_rsh_to_status_created',
      fields: ['to_status', 'created_at'],
      using: 'BTREE'
    })
    await queryInterface.addIndex('REFUND_STATUS_HISTORY', {
      name: 'idx_rsh_changed_by',
      fields: ['changed_by_type', 'changed_by_id'],
      using: 'BTREE'
    })
  },

  async down(queryInterface: QueryInterface) {
    try {
      await queryInterface.removeIndex(
        'REFUND_STATUS_HISTORY',
        'idx_rsh_refund_order_created'
      )
    } catch {}
    try {
      await queryInterface.removeIndex(
        'REFUND_STATUS_HISTORY',
        'idx_rsh_to_status_created'
      )
    } catch {}
    try {
      await queryInterface.removeIndex(
        'REFUND_STATUS_HISTORY',
        'idx_rsh_changed_by'
      )
    } catch {}
    await queryInterface.dropTable('REFUND_STATUS_HISTORY')
  }
}
