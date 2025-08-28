import { QueryInterface, DataTypes } from 'sequelize';
import { OrderStatus } from '../types/enum';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('ORDERS', {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      order_code: { type: DataTypes.STRING(255), allowNull: false},
      customer_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'USERS', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      store_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'STORES', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      reference: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: { type: DataTypes.ENUM(...Object.values(OrderStatus)), allowNull: false, defaultValue: OrderStatus.PENDING },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    await queryInterface.addIndex('ORDERS', ['customer_id']);
    await queryInterface.addIndex('ORDERS', ['store_id']);
    await queryInterface.addIndex('ORDERS', ['status']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('ORDERS');
  },
};