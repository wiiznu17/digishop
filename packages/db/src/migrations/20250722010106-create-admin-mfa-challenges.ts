import { QueryInterface, DataTypes } from "sequelize";
export default {
  async up(q: QueryInterface) {
    await q.createTable("ADMIN_MFA_CHALLENGES", {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      factor_type: { type: DataTypes.ENUM("TOTP", "WEBAUTHN", "SMS"), allowNull: false },
      challenge_id: { type: DataTypes.STRING(36), allowNull: false, unique: true },
      status: { type: DataTypes.ENUM("PENDING", "PASSED", "FAILED", "EXPIRED"), allowNull: false, defaultValue: "PENDING" },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      resolved_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    });
    await q.addIndex("ADMIN_MFA_CHALLENGES", ["admin_id"]);
    await q.addIndex("ADMIN_MFA_CHALLENGES", ["challenge_id"], { unique: true });
  },
  async down(q: QueryInterface) {
    await q.dropTable("ADMIN_MFA_CHALLENGES");
  },
};
