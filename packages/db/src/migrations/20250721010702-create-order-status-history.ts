// migrations/2025xxxx-create-orderStatusHistory.ts
import { QueryInterface, DataTypes } from 'sequelize';
import { ActorType, OrderStatus } from '../types/enum';

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable(
      'ORDER_STATUS_HISTORY',
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        order_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'ORDERS', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        from_status: {
          type: DataTypes.ENUM(...Object.values(OrderStatus)),
          allowNull: true,
        },
        to_status: {
          type: DataTypes.ENUM(...Object.values(OrderStatus)),
          allowNull: false,
        },
        changed_by_type: {
          type: DataTypes.ENUM(...Object.values(ActorType)),
          allowNull: false,
        },
        changed_by_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
        },
        reason: { type: DataTypes.TEXT, allowNull: true },
        source: { type: DataTypes.STRING(50), allowNull: true },
        correlation_id: { type: DataTypes.STRING(100), allowNull: true },
        metadata: { type: DataTypes.JSON, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    await queryInterface.addIndex('ORDER_STATUS_HISTORY', {
      name: 'idx_osh_order_created_at',
      fields: ['order_id', 'created_at'],
      using: 'BTREE',
    });
    await queryInterface.addIndex('ORDER_STATUS_HISTORY', {
      name: 'idx_osh_to_status_created_at',
      fields: ['to_status', 'created_at'],
      using: 'BTREE',
    });
    await queryInterface.addIndex('ORDER_STATUS_HISTORY', {
      name: 'idx_osh_changed_by',
      fields: ['changed_by_type', 'changed_by_id'],
      using: 'BTREE',
    });
  },

  async down(queryInterface: QueryInterface) {
    try { await queryInterface.removeIndex('ORDER_STATUS_HISTORY', 'idx_osh_order_created_at'); } catch {}
    try { await queryInterface.removeIndex('ORDER_STATUS_HISTORY', 'idx_osh_to_status_created_at'); } catch {}
    try { await queryInterface.removeIndex('ORDER_STATUS_HISTORY', 'idx_osh_changed_by'); } catch {}
    await queryInterface.dropTable('ORDER_STATUS_HISTORY');
  },
};
