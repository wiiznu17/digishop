// src/migrations/20250828090000-create-refund-orders.ts
import { QueryInterface, DataTypes } from "sequelize";

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
      reason: { type: DataTypes.TEXT, allowNull: true },
      merchant_reject_reason: { type: DataTypes.TEXT, allowNull: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      status: {
        type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"),
        allowNull: false,
        defaultValue: "REQUESTED",
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      contact_email: { type: DataTypes.STRING(255), allowNull: true },

      requested_by: { type: DataTypes.ENUM("CUSTOMER", "MERCHANT"), allowNull: true },
      requested_at: { type: DataTypes.DATE, allowNull: true },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      refunded_at: { type: DataTypes.DATE, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex("REFUND_ORDERS", ["order_id"], { name: "idx_refund_orders_order_id" });
    await queryInterface.addIndex("REFUND_ORDERS", ["status"], { name: "idx_refund_orders_status" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("REFUND_ORDERS");
  },
};
