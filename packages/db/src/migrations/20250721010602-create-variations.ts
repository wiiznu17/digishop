import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.createTable(
      'VARIATIONS',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        uuid: { type: DataTypes.STRING(36), allowNull: false },
        product_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'PRODUCTS', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: { type: DataTypes.STRING(64), allowNull: false },
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

    await q.addIndex('VARIATIONS', ['uuid'], {
      unique: true,
      name: 'uq_variations_uuid'
    })
    await q.addIndex('VARIATIONS', ['product_id'], {
      name: 'ix_variations_product'
    })
    await q.addIndex('VARIATIONS', ['product_id', 'name'], {
      name: 'ix_variations_product_name'
    })
  },

  async down(q: QueryInterface): Promise<void> {
    await q.dropTable('VARIATIONS')
  }
}
