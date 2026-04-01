import { QueryInterface, DataTypes } from 'sequelize'
export default {
  async up(q: QueryInterface) {
    await q.createTable('ADMIN_MFA_FACTORS', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      type: {
        type: DataTypes.ENUM('TOTP', 'WEBAUTHN', 'SMS'),
        allowNull: false
      },
      secret_or_public: { type: DataTypes.TEXT, allowNull: true },
      label: { type: DataTypes.STRING(191), allowNull: true },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'DISABLED'),
        allowNull: false,
        defaultValue: 'ACTIVE'
      },
      added_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      last_used_at: { type: DataTypes.DATE, allowNull: true },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    })
    await q.addIndex('ADMIN_MFA_FACTORS', ['admin_id'])
    await q.addIndex('ADMIN_MFA_FACTORS', ['type'])
  },
  async down(q: QueryInterface) {
    await q.dropTable('ADMIN_MFA_FACTORS')
  }
}
