import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();
    const toMinor = (baht: number) => baht * 100;

    await queryInterface.bulkInsert('PRODUCTS', [
      {
        id: 1001,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 1,
        name: 'Smartphone X',
        description: 'A powerful smartphone',
        price_minor: toMinor(50000), // 50,000 บาท -> สตางค์
        stock_quantity: 100,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 1002,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 2,
        name: 'Smartphone Y',
        description: 'Budget-friendly smartphone',
        price_minor: toMinor(30000),
        stock_quantity: 150,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 1003,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 1,
        name: 'Laptop Pro 15',
        description: 'High-performance laptop for professionals',
        price_minor: toMinor(120000),
        stock_quantity: 50,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 1004,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 3,
        name: 'Wireless Earbuds',
        description: 'Noise-canceling earbuds',
        price_minor: toMinor(12000),
        stock_quantity: 200,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 1005,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 4,
        name: 'Smartwatch Z',
        description: 'Fitness-focused smartwatch',
        price_minor: toMinor(30000),
        stock_quantity: 75,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('PRODUCTS', { id: [1001, 1002, 1003, 1004, 1005] });
  },
};
