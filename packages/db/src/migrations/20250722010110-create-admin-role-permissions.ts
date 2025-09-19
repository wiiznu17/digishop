import { QueryInterface, DataTypes } from "sequelize";
export default {
  async up(q: QueryInterface) {
    await q.createTable("ADMIN_ROLE_PERMISSIONS", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      permission_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      condition_override_json: { type: DataTypes.JSON, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await q.addIndex("ADMIN_ROLE_PERMISSIONS", ["role_id", "permission_id"], { unique: true });
  },
  async down(q: QueryInterface) {
    await q.dropTable("ADMIN_ROLE_PERMISSIONS");
  },
};
