import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      "ORDER_ITEMS",
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
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
        quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },

        // amounts (minor units)
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

        // snapshots
        product_name_snapshot: { type: DataTypes.STRING(200), allowNull: false },
        product_sku_snapshot: { type: DataTypes.STRING(64), allowNull: false },
        product_snapshot: { type: DataTypes.JSON, allowNull: true },

        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_unicode_ci" }
    );

    await queryInterface.addIndex("ORDER_ITEMS", ["order_id"]);
    await queryInterface.addIndex("ORDER_ITEMS", ["product_id"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("ORDER_ITEMS");
  },
};
