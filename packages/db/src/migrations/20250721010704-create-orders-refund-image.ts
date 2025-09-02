// src/migrations/2025xxxx-create-refund-images.ts
import { QueryInterface, DataTypes, Sequelize } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("REFUND_IMAGES", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      refund_order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "REFUND_ORDERS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      url: { type: DataTypes.TEXT, allowNull: false },
      blob_name: { type: DataTypes.STRING(255), allowNull: false },
      file_name: { type: DataTypes.STRING(255), allowNull: false },
      is_main: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex("REFUND_IMAGES", { name: "idx_refund_images_refund_order_id", fields: ["refund_order_id"] });
    await queryInterface.addIndex("REFUND_IMAGES", { name: "idx_refund_images_refund_order_sort", fields: ["refund_order_id", "order"] });
  },

  async down(queryInterface: QueryInterface) {
    try { await queryInterface.removeIndex("REFUND_IMAGES", "idx_refund_images_refund_order_sort"); } catch {}
    try { await queryInterface.removeIndex("REFUND_IMAGES", "idx_refund_images_refund_order_id"); } catch {}
    await queryInterface.dropTable("REFUND_IMAGES");
  },
};
