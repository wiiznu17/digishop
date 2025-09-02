import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.createTable("VARIATIONS", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "PRODUCTS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: { type: DataTypes.STRING(64), allowNull: false },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await q.addIndex("VARIATIONS", ["product_id"]);
    await q.addIndex("VARIATIONS", ["product_id", "name"]);
  },

  async down(q: QueryInterface): Promise<void> {
    await q.dropTable("VARIATIONS");
  },
};
