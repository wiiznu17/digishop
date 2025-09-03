// src/migrations/2025xxxx-create-refund-orders.ts
import { QueryInterface, DataTypes, Sequelize } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("REFUND_ORDERS", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },

      order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "ORDERS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      payment_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "PAYMENTS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      // money in minor units + currency
      amount_minor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      currency_code: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "THB" },

      reason: { type: DataTypes.TEXT, allowNull: true },
      merchant_reject_reason: { type: DataTypes.TEXT, allowNull: true },

      status: {
        type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"),
        allowNull: false,
        defaultValue: "REQUESTED",
      },

      refund_channel: { type: DataTypes.STRING(50), allowNull: true },
      refund_ref: { type: DataTypes.STRING(100), allowNull: true },

      description: { type: DataTypes.TEXT, allowNull: true },
      contact_email: { type: DataTypes.STRING(255), allowNull: true },

      requested_by: { type: DataTypes.ENUM("CUSTOMER", "MERCHANT"), allowNull: true },
      requested_at: { type: DataTypes.DATE, allowNull: true },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      refunded_at: { type: DataTypes.DATE, allowNull: true },

      pgw_payload: { type: DataTypes.JSON, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex("REFUND_ORDERS", ["order_id"], { name: "idx_refund_orders_order_id" });
    await queryInterface.addIndex("REFUND_ORDERS", ["payment_id"], { name: "idx_refund_orders_payment_id" });
    await queryInterface.addIndex("REFUND_ORDERS", ["status"], { name: "idx_refund_orders_status" });
    await queryInterface.addIndex("REFUND_ORDERS", ["created_at"], { name: "idx_refund_orders_created_at" });
  },

  async down(queryInterface: QueryInterface) {
    try { await queryInterface.removeIndex("REFUND_ORDERS", "idx_refund_orders_order_id"); } catch {}
    try { await queryInterface.removeIndex("REFUND_ORDERS", "idx_refund_orders_payment_id"); } catch {}
    try { await queryInterface.removeIndex("REFUND_ORDERS", "idx_refund_orders_status"); } catch {}
    try { await queryInterface.removeIndex("REFUND_ORDERS", "idx_refund_orders_created_at"); } catch {}
    await queryInterface.dropTable("REFUND_ORDERS");
  },
};
