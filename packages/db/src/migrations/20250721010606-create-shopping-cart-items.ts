import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.createTable("SHOPPING_CART_ITEMS", {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      cart_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "SHOPPING_CARTS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      product_item_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "PRODUCT_ITEMS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },

      // snapshot pricing (minor units)
      unit_price_minor: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      discount_minor: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      line_total_minor: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
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
    await q.addIndex("SHOPPING_CART_ITEMS", ["cart_id"]);
    await q.addIndex("SHOPPING_CART_ITEMS", ["product_item_id"]);

    // ป้องกันการเพิ่ม SKU เดียวซ้ำในตะกร้าเดียวกัน
    await q.addIndex("SHOPPING_CART_ITEMS", ["cart_id", "product_item_id"], { unique: true });
  },

  async down(q: QueryInterface): Promise<void> {
    await q.dropTable("SHOPPING_CART_ITEMS");
  },
};
