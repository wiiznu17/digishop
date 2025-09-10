import { QueryInterface, DataTypes } from 'sequelize';
import { ProductStatus } from '../types/enum';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('PRODUCTS', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
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
      status: { type: DataTypes.ENUM(...Object.values(ProductStatus)), allowNull: false, defaultValue: ProductStatus.ACTIVE },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    await queryInterface.addIndex('PRODUCTS', ['uuid'], { unique: true, name: 'uq_products_uuid' });
    await queryInterface.addIndex('PRODUCTS', ['store_id'], { name: 'ix_products_store' });
    await queryInterface.addIndex('PRODUCTS', ['category_id'], { name: 'ix_products_category' });
    await queryInterface.addIndex('PRODUCTS', ['status'], { name: 'ix_products_status' });
    await queryInterface.addIndex('PRODUCTS', ['created_at'], { name: 'ix_products_created_at' });
    await queryInterface.addIndex('PRODUCTS', ['price_minor'], { name: 'ix_products_price_minor' });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('PRODUCTS');
  },
};
