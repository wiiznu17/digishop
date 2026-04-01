import { QueryInterface, DataTypes } from 'sequelize'
import { OrderStatus } from '../types/enum'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'ORDERS',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        checkout_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'CHECKOUT', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        store_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'STORES', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        reference: { type: DataTypes.STRING(64), allowNull: false },

        // amounts in minor units
        subtotal_minor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        shipping_fee_minor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        tax_total_minor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        discount_total_minor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        grand_total_minor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        currency_code: {
          type: DataTypes.STRING(3),
          allowNull: false,
          defaultValue: 'THB'
        },

        status: {
          type: DataTypes.ENUM(...Object.values(OrderStatus)),
          allowNull: false,
          defaultValue: OrderStatus.PENDING
        },
        order_note: { type: DataTypes.STRING(500), allowNull: true },

        // snapshots
        customer_name_snapshot: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        customer_email_snapshot: {
          type: DataTypes.STRING(254),
          allowNull: false
        },
        store_name_snapshot: { type: DataTypes.STRING(200), allowNull: false },

        idempotency_key: { type: DataTypes.STRING(100), allowNull: true },
        correlation_id: { type: DataTypes.STRING(100), allowNull: true },

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
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    )

    await queryInterface.addIndex('ORDERS', ['checkout_id'])
    await queryInterface.addIndex('ORDERS', ['store_id'])
    await queryInterface.addIndex('ORDERS', ['status'])
    await queryInterface.addIndex('ORDERS', ['created_at'])
    // await queryInterface.addConstraint("ORDERS", {
    //   type: "unique",
    //   fields: ["order_code"],
    //   name: "uq_orders_order_code",
    // });
    // await queryInterface.addConstraint("ORDERS", {
    //   type: "unique",
    //   fields: ["reference"],
    //   name: "uq_orders_reference",
    // });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // ต้องดร็อป constraints/indices ที่ผูกกับ ENUM ก่อนดร็อปตาราง (สำหรับบาง dialect)
    // await queryInterface.removeConstraint("ORDERS", "uq_orders_order_code").catch(() => {});
    // await queryInterface.removeConstraint("ORDERS", "uq_orders_reference").catch(() => {});
    await queryInterface.dropTable('ORDERS')
  }
}
