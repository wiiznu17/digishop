// migrations/20250721010702-create-order-status-history.ts
import { QueryInterface, DataTypes } from 'sequelize';
import { OrderStatus } from '../types/enum';

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
          type: DataTypes.ENUM('CUSTOMER','MERCHANT','ADMIN','SYSTEM'),
          allowNull: false,
        },
        changed_by_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
        },
        reason: { type: DataTypes.TEXT, allowNull: true },
        source: { type: DataTypes.STRING(50), allowNull: true },
        correlation_id: { type: DataTypes.STRING(100), allowNull: true },
        metadata: { type: DataTypes.JSON, allowNull: true }, // MySQL 5.7+ / 8.0 OK
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

    // ตั้งชื่อ index เองให้สั้น (≤ 64 char)
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
    // ลบดัชนี (กันบาง version เข้มงวดเรื่อง drop table ที่ยังมี index ชื่ออยู่)
    try { await queryInterface.removeIndex('ORDER_STATUS_HISTORY', 'idx_osh_order_created_at'); } catch {}
    try { await queryInterface.removeIndex('ORDER_STATUS_HISTORY', 'idx_osh_to_status_created_at'); } catch {}
    try { await queryInterface.removeIndex('ORDER_STATUS_HISTORY', 'idx_osh_changed_by'); } catch {}

    await queryInterface.dropTable('ORDER_STATUS_HISTORY');
    // MySQL ไม่ต้อง drop ENUM type แยกเหมือน Postgres
  },
};
