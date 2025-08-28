// src/migrations/20250828091500-create-refund-images.ts
import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("REFUND_IMAGES", {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
      refund_order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "REFUND_ORDERS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      url: { type: DataTypes.TEXT, allowNull: false },
      blob_name: { type: DataTypes.STRING, allowNull: false },
      file_name: { type: DataTypes.STRING, allowNull: false },
      is_main: { type: DataTypes.BOOLEAN, defaultValue: false },
      order: { type: DataTypes.INTEGER, defaultValue: 0 },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex("REFUND_IMAGES", ["refund_order_id"], { name: "idx_refund_images_refund_order_id" });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("REFUND_IMAGES");
  },
};
