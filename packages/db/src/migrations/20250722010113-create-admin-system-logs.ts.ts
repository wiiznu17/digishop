import { QueryInterface, DataTypes } from 'sequelize'
export default {
  async up(q: QueryInterface) {
    await q.createTable('ADMIN_SYSTEM_LOGS', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      uuid: { type: DataTypes.STRING(36), allowNull: true },
      admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      action: { type: DataTypes.STRING(128), allowNull: false },
      target_entity: { type: DataTypes.STRING(64), allowNull: false },
      target_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      correlation_id: { type: DataTypes.STRING(64), allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      metadata_json: { type: DataTypes.JSON, allowNull: true },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
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
    await q.addIndex('ADMIN_SYSTEM_LOGS', ['admin_id'])
    await q.addIndex('ADMIN_SYSTEM_LOGS', ['timestamp'])
    await q.addIndex('ADMIN_SYSTEM_LOGS', ['target_entity', 'target_id'])
    await q.addIndex('ADMIN_SYSTEM_LOGS', ['correlation_id'])
  },
  async down(q: QueryInterface) {
    await q.dropTable('ADMIN_SYSTEM_LOGS')
  }
}
