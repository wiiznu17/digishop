import { QueryInterface, DataTypes } from "sequelize";
export default {
  async up(q: QueryInterface) {
    await q.createTable("ADMIN_USER_ROLES", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      start_at: { type: DataTypes.DATE, allowNull: true },
      end_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await q.addIndex("ADMIN_USER_ROLES", ["admin_id", "role_id"], { unique: true });
  },
  async down(q: QueryInterface) {
    await q.dropTable("ADMIN_USER_ROLES");
  },
};
