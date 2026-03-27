import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(q: QueryInterface) {
    await q.createTable(
      'ADMIN_USERS',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: { type: DataTypes.STRING(36), allowNull: true },
        email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(191), allowNull: false },
        password: { type: DataTypes.STRING(191), allowNull: true },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
          allowNull: false,
          defaultValue: 'ACTIVE'
        },
        last_login_at: { type: DataTypes.DATE, allowNull: true },
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
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    )
    await q.addIndex('ADMIN_USERS', ['email'])
  },
  async down(q: QueryInterface) {
    await q.dropTable('ADMIN_USERS')
  }
}
