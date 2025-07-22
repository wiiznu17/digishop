import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('PRODUCT_VIEWS', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'PRODUCTS', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'USERS', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      session_id: { type: DataTypes.STRING(100), allowNull: true },
      viewed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      ip_address: { type: DataTypes.STRING(45), allowNull: true },
      user_agent: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    await queryInterface.addIndex('PRODUCT_VIEWS', ['product_id']);
    await queryInterface.addIndex('PRODUCT_VIEWS', ['user_id']);
    await queryInterface.addIndex('PRODUCT_VIEWS', ['viewed_at']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('PRODUCT_VIEWS');
  },
};