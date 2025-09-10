import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.createTable("PRODUCT_CONFIGURATIONS", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      uuid: { type: DataTypes.STRING(36), allowNull: false },

      product_item_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "PRODUCT_ITEMS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      variation_option_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "VARIATION_OPTIONS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await q.addIndex("PRODUCT_CONFIGURATIONS", ["uuid"], { unique: true, name: "uq_product_configurations_uuid" });
    await q.addIndex("PRODUCT_CONFIGURATIONS", ["product_item_id"]);
    await q.addIndex("PRODUCT_CONFIGURATIONS", ["variation_option_id"]);
    await q.addIndex("PRODUCT_CONFIGURATIONS", ["product_item_id", "variation_option_id"], {
      unique: true,
      name: "uq_prodconf_item_option",
    });
  },

  async down(q: QueryInterface): Promise<void> {
    await q.dropTable("PRODUCT_CONFIGURATIONS");
  },
};
