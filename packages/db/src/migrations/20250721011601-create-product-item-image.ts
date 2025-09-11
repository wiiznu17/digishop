import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'PRODUCT_ITEM_IMAGES',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        uuid: {
          // เก็บเป็น CHAR(36); default uuid v4 ให้ที่ Model/Seeder (MySQL ไม่มี uuidv4() ใน DB)
          type: DataTypes.STRING(36),
          allowNull: false,
          unique: true,
        },
        product_item_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'PRODUCT_ITEMS',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        blob_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        file_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    )

    // Indexes
    await queryInterface.addIndex('PRODUCT_IMAGES', ['uuid'], { unique: true, name: 'uq_product_item_images_uuid' })
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('PRODUCT_ITEM_IMAGES')
  },
}
