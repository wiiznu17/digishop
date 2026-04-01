import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'PRODUCT_IMAGES',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: {
          // เก็บเป็น CHAR(36); default uuid v4 ให้ที่ Model/Seeder (MySQL ไม่มี uuidv4() ใน DB)
          type: DataTypes.STRING(36),
          allowNull: false,
          unique: true
        },
        product_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'PRODUCTS',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        blob_name: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        file_name: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        is_main: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        sort_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    )

    // Indexes
    await queryInterface.addIndex('PRODUCT_IMAGES', ['uuid'], {
      unique: true,
      name: 'uq_product_images_uuid'
    })
    await queryInterface.addIndex(
      'PRODUCT_IMAGES',
      ['product_id', 'sort_order'],
      { name: 'ix_product_images_product_sort' }
    )
    await queryInterface.addIndex('PRODUCT_IMAGES', ['product_id', 'is_main'], {
      name: 'ix_product_images_product_main'
    })
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('PRODUCT_IMAGES')
  }
}
