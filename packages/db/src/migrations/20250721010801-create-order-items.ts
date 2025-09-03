import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("ORDER_ITEMS", {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "ORDERS", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "PRODUCTS", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      product_item_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "PRODUCT_ITEMS", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      unit_price_minor: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      discount_minor: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: "0.0000",
      },
      line_total_minor: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },

      // snapshots
      product_name_snapshot: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      product_sku_snapshot: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      product_image_snapshot: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      options_text: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      product_snapshot: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Indexes
    await queryInterface.addIndex("ORDER_ITEMS", ["order_id"]);
    await queryInterface.addIndex("ORDER_ITEMS", ["product_id"]);
    await queryInterface.addIndex("ORDER_ITEMS", ["product_item_id"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("ORDER_ITEMS");
  },
};
