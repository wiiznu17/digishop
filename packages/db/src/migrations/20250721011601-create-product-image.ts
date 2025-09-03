import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'PRODUCT_IMAGES',
      {
        id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        productId: {
          // type: DataTypes.UUID,
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'PRODUCTS',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        blobName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        fileName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isMain: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        sort_order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      }
    );

    // Index เพื่อประสิทธิภาพในการค้นหา
    await queryInterface.addIndex('PRODUCT_IMAGES', ['productId']);
    await queryInterface.addIndex('PRODUCT_IMAGES', ['isMain']);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('PRODUCT_IMAGES');
  },
};
