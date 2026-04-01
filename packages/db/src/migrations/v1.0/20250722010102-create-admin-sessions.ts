import { QueryInterface, DataTypes } from 'sequelize'
export default {
  async up(q: QueryInterface) {
    await q.createTable('ADMIN_SESSIONS', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      uuid: { type: DataTypes.STRING(36), allowNull: true },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      jti: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      refresh_token_hash: { type: DataTypes.STRING(191), allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
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
    await q.addIndex('ADMIN_SESSIONS', ['admin_id'])
    await q.addIndex('ADMIN_SESSIONS', ['jti'], { unique: true })
  },
  async down(q: QueryInterface) {
    await q.dropTable('ADMIN_SESSIONS')
  }
}
