import { QueryInterface, DataTypes } from 'sequelize'
export default {
  async up(q: QueryInterface) {
    await q.createTable('ADMIN_PERMISSIONS', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      uuid: { type: DataTypes.STRING(36), allowNull: true },
      resource: { type: DataTypes.STRING(64), allowNull: false },
      action: { type: DataTypes.STRING(64), allowNull: false },
      effect: {
        type: DataTypes.ENUM('ALLOW', 'DENY'),
        allowNull: false,
        defaultValue: 'ALLOW'
      },
      condition_json: { type: DataTypes.JSON, allowNull: true },
      slug: { type: DataTypes.STRING(128), allowNull: false, unique: true },
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
    await q.addIndex('ADMIN_PERMISSIONS', ['resource', 'action'])
  },
  async down(q: QueryInterface) {
    await q.dropTable('ADMIN_PERMISSIONS')
  }
}
