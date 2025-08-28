// src/migrations/20250828091000-create-refund-status-history.ts
import { QueryInterface, DataTypes } from "sequelize";
import { ActorType } from "../types/enum";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("REFUND_STATUS_HISTORY", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      refund_order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "REFUND_ORDERS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      from_status: { type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"), allowNull: true },
      to_status: { type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"), allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: true },

      changed_by_type: { type: DataTypes.ENUM(...Object.values(ActorType)), allowNull: true },
      changed_by_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      source: { type: DataTypes.STRING(50), allowNull: true },
      correlation_id: { type: DataTypes.STRING(100), allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex("REFUND_STATUS_HISTORY", ["refund_order_id"], { name: "idx_rsh_refund_order_id" });
    await queryInterface.addIndex("REFUND_STATUS_HISTORY", ["to_status"], { name: "idx_rsh_to_status" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("REFUND_STATUS_HISTORY");
  },
};
