import { QueryInterface, DataTypes } from 'sequelize';
import { ProductStatus } from '../types/enum';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('PRODUCTS', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      store_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'STORES', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      category_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'CATEGORIES', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      name: { type: DataTypes.STRING(191), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.ENUM(...Object.values(ProductStatus)), allowNull: false, defaultValue: ProductStatus.ACTIVE },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    await queryInterface.addIndex('PRODUCTS', ['store_id']);
    await queryInterface.addIndex('PRODUCTS', ['category_id']);
    await queryInterface.addIndex('PRODUCTS', ['status']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('PRODUCTS');
  },
};