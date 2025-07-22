import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Products', [
      {
        store_id: 1,
        category_id: 1,
        name: 'Smartphone X',
        description: 'A powerful smartphone',
        price: 599.99,
        stock_quantity: 100,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Products', {}, {});
  },
};