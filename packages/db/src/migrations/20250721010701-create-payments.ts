import { QueryInterface, DataTypes } from "sequelize";
import { PaymentStatus } from "../types/enum";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      "PAYMENTS",
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        checkout_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "CHECKOUT", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },

        url_redirect: { type: DataTypes.STRING(2048), allowNull: true },

        payment_method: { type: DataTypes.STRING(50), allowNull: false },
        status: {
          type: DataTypes.ENUM(...Object.values(PaymentStatus)),
          allowNull: false,
          defaultValue: PaymentStatus.PENDING,
        },
        paid_at: { type: DataTypes.DATE, allowNull: true },
        expiry_at: { type: DataTypes.DATE, allowNull: true },

        // gateway snapshot fields
        provider: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "DGS_PGW" },
        provider_ref: { type: DataTypes.STRING(128), allowNull: true },
        channel: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "CARD" },
        currency_code: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "THB" },

        amount_authorized_minor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        amount_captured_minor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        amount_refunded_minor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

        pgw_status: { type: DataTypes.STRING(32), allowNull: true },
        pgw_payload: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },

        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_unicode_ci" }
    );

    await queryInterface.addIndex("PAYMENTS", ["checkout_id"]);
    await queryInterface.addIndex("PAYMENTS", ["status"]);
    await queryInterface.addIndex("PAYMENTS", ["provider_ref"]);
    await queryInterface.addIndex("PAYMENTS", ["created_at"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("PAYMENTS");
  },
};
