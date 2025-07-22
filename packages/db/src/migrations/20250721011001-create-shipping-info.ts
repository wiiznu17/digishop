import { QueryInterface, DataTypes } from 'sequelize';
import { ShippingStatus } from '../types/enum';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('SHIPPING_INFO', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      order_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'ORDERS', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      tracking_number: { type: DataTypes.STRING(100), allowNull: true },
      carrier: { type: DataTypes.STRING(100), allowNull: true },
      shipping_status: { type: DataTypes.ENUM(...Object.values(ShippingStatus)), allowNull: false, defaultValue: ShippingStatus.PROCESSING },
      shipped_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    await queryInterface.addIndex('SHIPPING_INFO', ['order_id']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('SHIPPING_INFO');
  },
};