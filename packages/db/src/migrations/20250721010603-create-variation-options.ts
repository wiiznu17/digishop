import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.createTable("VARIATION_OPTIONS", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      uuid: { type: DataTypes.STRING(36), allowNull: false },
      variation_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: "VARIATIONS", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      value: { type: DataTypes.STRING(128), allowNull: false },
      sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });

    await q.addIndex("VARIATION_OPTIONS", ["uuid"], { unique: true, name: "uq_variation_options_uuid" });
    await q.addIndex("VARIATION_OPTIONS", ["variation_id"], { name: "ix_variation_options_variation" });
    await q.addIndex("VARIATION_OPTIONS", ["variation_id", "value"], { name: "ix_variation_options_variation_value" });
  },

  async down(q: QueryInterface): Promise<void> {
    await q.dropTable("VARIATION_OPTIONS");
  },
};
