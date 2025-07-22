import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('ADMIN_SYSTEM_LOGS', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      admin_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'ADMIN_USERS', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      action: { type: DataTypes.STRING(191), allowNull: false },
      target_entity: { type: DataTypes.STRING(191), allowNull: true },
      target_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    await queryInterface.addIndex('ADMIN_SYSTEM_LOGS', ['admin_id']);
    await queryInterface.addIndex('ADMIN_SYSTEM_LOGS', ['target_entity']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('ADMIN_SYSTEM_LOGS');
  },
};