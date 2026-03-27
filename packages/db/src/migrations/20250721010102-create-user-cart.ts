import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(q: QueryInterface): Promise<void> {
    await q.createTable('SHOPPING_CARTS', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    })

    // Unique: 1 user มีได้แค่ 1 cart
    await q.addIndex('SHOPPING_CARTS', ['user_id'], { unique: true })
  },

  async down(q: QueryInterface): Promise<void> {
    await q.dropTable('SHOPPING_CARTS')
  }
}
