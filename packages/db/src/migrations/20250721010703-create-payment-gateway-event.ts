import { QueryInterface, DataTypes, Sequelize } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("PAYMENT_GATEWAY_EVENTS", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },

      checkout_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "CHECKOUT", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      payment_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "PAYMENTS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      refund_order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "REFUND_ORDERS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      type: { type: DataTypes.STRING(50), allowNull: false },
      amount_minor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      provider: { type: DataTypes.STRING(50), allowNull: false },
      provider_ref: { type: DataTypes.STRING(100), allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false },
      request_id: { type: DataTypes.STRING(100), allowNull: true },

      req_json: { type: DataTypes.JSON, allowNull: true },
      res_json: { type: DataTypes.JSON, allowNull: true },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    },
    {
      engine: "InnoDB",
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    });

    await queryInterface.addIndex("PAYMENT_GATEWAY_EVENTS", { name: "idx_pge_checkout_id", fields: ["checkout_id"] });
    await queryInterface.addIndex("PAYMENT_GATEWAY_EVENTS", { name: "idx_pge_payment_id", fields: ["payment_id"] });
    await queryInterface.addIndex("PAYMENT_GATEWAY_EVENTS", { name: "idx_pge_refund_order_id", fields: ["refund_order_id"] });
    await queryInterface.addIndex("PAYMENT_GATEWAY_EVENTS", { name: "idx_pge_provider_ref", fields: ["provider_ref"] });
    await queryInterface.addIndex("PAYMENT_GATEWAY_EVENTS", { name: "idx_pge_request_id", fields: ["request_id"] });
    await queryInterface.addIndex("PAYMENT_GATEWAY_EVENTS", { name: "idx_pge_created_at", fields: ["created_at"] });
    await queryInterface.addIndex("PAYMENT_GATEWAY_EVENTS", { name: "idx_pge_payment_created", fields: ["payment_id", "created_at"] });
  },

  async down(queryInterface: QueryInterface) {
    try { await queryInterface.removeIndex("PAYMENT_GATEWAY_EVENTS", "idx_pge_payment_created"); } catch {}
    try { await queryInterface.removeIndex("PAYMENT_GATEWAY_EVENTS", "idx_pge_created_at"); } catch {}
    try { await queryInterface.removeIndex("PAYMENT_GATEWAY_EVENTS", "idx_pge_request_id"); } catch {}
    try { await queryInterface.removeIndex("PAYMENT_GATEWAY_EVENTS", "idx_pge_provider_ref"); } catch {}
    try { await queryInterface.removeIndex("PAYMENT_GATEWAY_EVENTS", "idx_pge_refund_order_id"); } catch {}
    try { await queryInterface.removeIndex("PAYMENT_GATEWAY_EVENTS", "idx_pge_payment_id"); } catch {}
    try { await queryInterface.removeIndex("PAYMENT_GATEWAY_EVENTS", "idx_pge_checkout_id"); } catch {}
    await queryInterface.dropTable("PAYMENT_GATEWAY_EVENTS");
  },
};
