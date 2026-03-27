import { QueryInterface, DataTypes } from 'sequelize'
export default {
  async up(q: QueryInterface) {
    await q.createTable('ADMIN_PASSWORD_RESETS', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      token_hash: { type: DataTypes.STRING(191), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE, allowNull: true },
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
    await q.addIndex('ADMIN_PASSWORD_RESETS', ['admin_id'])
    await q.addIndex('ADMIN_PASSWORD_RESETS', ['token_hash'])
  },
  async down(q: QueryInterface) {
    await q.dropTable('ADMIN_PASSWORD_RESETS')
  }
}
