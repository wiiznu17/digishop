import { QueryInterface, DataTypes } from 'sequelize';
import { ShippingType } from '../types/enum';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('SHIPPING_CONFIGS', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      store_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'STORES', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      carrier: { type: DataTypes.STRING(191), allowNull: false },
      shipping_type: {
        type: DataTypes.ENUM(...Object.values(ShippingType)),
        allowNull: false,
      },
      pickup_time: { type: DataTypes.TIME, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    await queryInterface.addIndex('SHIPPING_CONFIGS', ['store_id']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('SHIPPING_CONFIGS');
  },
};