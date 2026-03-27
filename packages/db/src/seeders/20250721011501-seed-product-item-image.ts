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
        url: 'https://digishop.blob.core.windows.net/product/products/9ddb9d37-69ec-4725-8ae1-203c838ea093/items/4def94a4-5720-4945-aaf9-415f15c87863/d047e37a-02fc-4205-b583-b97c71d2e3fb.jpg',
        blob_name: 'smartphone-x-main.jpg',
        file_name: 'smartphone-x-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 2,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'smartphone-x-side.jpg',
        file_name: 'smartphone-x-side.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 3,
        url: 'https://digishop.blob.core.windows.net/product/products/9ddb9d37-69ec-4725-8ae1-203c838ea093/items/4def94a4-5720-4945-aaf9-415f15c87863/d047e37a-02fc-4205-b583-b97c71d2e3fb.jpg',
        blob_name: 'smartphone-y-main.jpg',
        file_name: 'smartphone-y-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 4,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'laptop-pro15-main.jpg',
        file_name: 'laptop-pro15-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 5,
        url: 'https://digishop.blob.core.windows.net/product/products/9ddb9d37-69ec-4725-8ae1-203c838ea093/items/4def94a4-5720-4945-aaf9-415f15c87863/d047e37a-02fc-4205-b583-b97c71d2e3fb.jpg',
        blob_name: 'earbuds-main.jpg',
        file_name: 'earbuds-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 6,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 7,
        url: 'https://digishop.blob.core.windows.net/product/products/9ddb9d37-69ec-4725-8ae1-203c838ea093/items/4def94a4-5720-4945-aaf9-415f15c87863/d047e37a-02fc-4205-b583-b97c71d2e3fb.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 8,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 9,
        url: 'https://digishop.blob.core.windows.net/product/products/9ddb9d37-69ec-4725-8ae1-203c838ea093/items/4def94a4-5720-4945-aaf9-415f15c87863/d047e37a-02fc-4205-b583-b97c71d2e3fb.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 10,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 11,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'wireless-earbuds.jpg',
        file_name: 'wireless-earbuds.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 12,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 13,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_item_id: 14,
        url: 'https://digishop.blob.core.windows.net/product/products/3c59b61d-0ee0-463a-b6c5-0ff429899aa9/3f1ecce7-81eb-4aa9-89b3-46221b105275.jpg',
        blob_name: 'smartwatch-z-main.jpg',
        file_name: 'smartwatch-z-main.jpg',
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    ])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('PRODUCT_IMAGES', {}, {})
  }
}
