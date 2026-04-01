import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.createTable('PRODUCT_ITEMS', {
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
      sku: { type: DataTypes.STRING(191), allowNull: false }, // NOT NULL
      stock_quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      is_enable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      price_minor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      image_url: { type: DataTypes.STRING(512), allowNull: true },

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
    })

    await q.addIndex('PRODUCT_ITEMS', ['uuid'], {
      unique: true,
      name: 'uq_product_items_uuid'
    })
    await q.addIndex('PRODUCT_ITEMS', ['product_id'])
    await q.addIndex('PRODUCT_ITEMS', ['product_id', 'sku'], {
      name: 'uniq_items_product_sku',
      unique: true
    })
    await q.addIndex('PRODUCT_ITEMS', ['is_enable'], {
      name: 'ix_product_items_is_enable'
    })
  },

  async down(q: QueryInterface): Promise<void> {
    await q.dropTable('PRODUCT_ITEMS')
  }
}
