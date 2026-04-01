import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'REVIEWS',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'USERS', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        product_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'PRODUCTS', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        order_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'ORDERS', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        rating: { type: DataTypes.INTEGER, allowNull: false },
        comment: { type: DataTypes.TEXT, allowNull: true },
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
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    )
    await queryInterface.addIndex('REVIEWS', ['product_id'])
    await queryInterface.addIndex('REVIEWS', ['user_id'])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('REVIEWS')
  }
}
