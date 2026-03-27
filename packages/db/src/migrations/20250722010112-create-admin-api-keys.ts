import { QueryInterface, DataTypes } from 'sequelize'
export default {
  async up(q: QueryInterface) {
    await q.createTable('ADMIN_API_KEYS', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      uuid: { type: DataTypes.STRING(36), allowNull: true },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(191), allowNull: false },
      key_hash: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      scopes_json: { type: DataTypes.JSON, allowNull: true },
      last_used_at: { type: DataTypes.DATE, allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: true },
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
    await q.addIndex('ADMIN_API_KEYS', ['admin_id'])
    await q.addIndex('ADMIN_API_KEYS', ['key_hash'], { unique: true })
  },
  async down(q: QueryInterface) {
    await q.dropTable('ADMIN_API_KEYS')
  }
}
