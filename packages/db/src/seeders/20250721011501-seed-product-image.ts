// seeders/XXXXXXXXXXXX-seed-product-images.ts
import { QueryInterface } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const now = new Date()

    await queryInterface.bulkInsert('PRODUCT_IMAGES', [
      // Smartphone X (1001)
      {
        uuid: uuidv4(),
        product_id: 1001,
        url: 'https://example.com/images/smartphone-x-main.jpg',
        blob_name: 'smartphone-x-main.jpg',
        file_name: 'smartphone-x-main.jpg',
        is_main: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_id: 1001,
        url: 'https://example.com/images/smartphone-x-side.jpg',
        blob_name: 'smartphone-x-side.jpg',
        file_name: 'smartphone-x-side.jpg',
        is_main: false,
        sort_order: 2,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // Smartphone Y (1002)
      {
        uuid: uuidv4(),
        product_id: 1002,
        url: 'https://example.com/images/smartphone-y-main.jpg',
        blob_name: 'smartphone-y-main.jpg',
        file_name: 'smartphone-y-main.jpg',
        is_main: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // Laptop Pro 15 (1003)
      {
        uuid: uuidv4(),
        product_id: 1003,
        url: 'https://example.com/images/laptop-pro15-main.jpg',
        blob_name: 'laptop-pro15-main.jpg',
        file_name: 'laptop-pro15-main.jpg',
        is_main: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // Wireless Earbuds (1004)
      {
        uuid: uuidv4(),
        product_id: 1004,
        url: 'https://example.com/images/earbuds-main.jpg',
        blob_name: 'earbuds-main.jpg',
        file_name: 'earbuds-main.jpg',
        is_main: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // Smartwatch Z (1005)
      {
        uuid: uuidv4(),
        product_id: 1005,
        url: 'https://example.com/images/smartwatch-z-main.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        is_main: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('PRODUCT_IMAGES', {}, {})
  },
}
