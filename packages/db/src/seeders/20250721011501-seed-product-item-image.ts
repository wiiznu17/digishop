// seeders/XXXXXXXXXXXX-seed-product-images.ts
import { QueryInterface } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    const now = new Date()

    await queryInterface.bulkInsert('PRODUCT_ITEM_IMAGES', [
      {
        uuid: uuidv4(),
        product_item_id: 1,
        url: 'https://example.com/images/smartphone-x-main.jpg',
        blob_name: 'smartphone-x-main.jpg',
        file_name: 'smartphone-x-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 2,
        url: 'https://example.com/images/smartphone-x-side.jpg',
        blob_name: 'smartphone-x-side.jpg',
        file_name: 'smartphone-x-side.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 3,
        url: 'https://example.com/images/smartphone-y-main.jpg',
        blob_name: 'smartphone-y-main.jpg',
        file_name: 'smartphone-y-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 4,
        url: 'https://example.com/images/laptop-pro15-main.jpg',
        blob_name: 'laptop-pro15-main.jpg',
        file_name: 'laptop-pro15-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 5,
        url: 'https://example.com/images/earbuds-main.jpg',
        blob_name: 'earbuds-main.jpg',
        file_name: 'earbuds-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 6,
        url: 'https://example.com/images/smartwatch-z-main.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 7,
        url: 'https://example.com/images/smartwatch-z-main.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 8,
        url: 'https://example.com/images/smartwatch-z-main.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 9,
        url: 'https://example.com/images/smartwatch-z-main.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        uuid: uuidv4(),
        product_item_id: 10,
        url: 'https://example.com/images/smartwatch-z-main.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
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
