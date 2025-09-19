import { QueryInterface, DataTypes } from "sequelize";
export default {
  async up(q: QueryInterface) {
    await q.createTable("ADMIN_RECOVERY_CODES", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      code_hash: { type: DataTypes.STRING(191), allowNull: false },
      status: { type: DataTypes.ENUM("UNUSED", "USED"), allowNull: false, defaultValue: "UNUSED" },
      used_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await q.addIndex("ADMIN_RECOVERY_CODES", ["admin_id"]);
    await q.addIndex("ADMIN_RECOVERY_CODES", ["code_hash"]);
  },
  async down(q: QueryInterface) {
    await q.dropTable("ADMIN_RECOVERY_CODES");
  },
};
