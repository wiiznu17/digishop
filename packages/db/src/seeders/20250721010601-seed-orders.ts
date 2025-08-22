import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('ORDERS', [
      {
        customer_id: 1,
        store_id: 1,
        total_price: 2500,
        status: 'PENDING',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Orders', {}, {});
  },
};