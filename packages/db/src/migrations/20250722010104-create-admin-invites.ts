import { QueryInterface, DataTypes } from "sequelize";
export default {
  async up(q: QueryInterface) {
    await q.createTable("ADMIN_INVITES", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: DataTypes.STRING(36), allowNull: true },
      email: { type: DataTypes.STRING(191), allowNull: false },
      invited_by_admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      token_hash: { type: DataTypes.STRING(191), allowNull: false },
      role_slug_default: { type: DataTypes.STRING(128), allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      accepted_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await q.addIndex("ADMIN_INVITES", ["email"]);
    await q.addIndex("ADMIN_INVITES", ["token_hash"]);
  },
  async down(q: QueryInterface) {
    await q.dropTable("ADMIN_INVITES");
  },
};
