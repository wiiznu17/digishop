import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'CATEGORIES',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        uuid: { type: DataTypes.STRING(36), allowNull: false },
        name: { type: DataTypes.STRING(191), allowNull: false },
        parent_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          references: { model: 'CATEGORIES', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
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
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    )

    await queryInterface.addIndex('CATEGORIES', ['uuid'], {
      unique: true,
      name: 'uq_categories_uuid'
    })
    await queryInterface.addIndex('CATEGORIES', ['parent_id'], {
      name: 'ix_categories_parent'
    })
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('CATEGORIES')
  }
}
