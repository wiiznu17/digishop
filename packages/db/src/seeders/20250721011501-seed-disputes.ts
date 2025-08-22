import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('DISPUTES', [
      {
        order_id: 1,
        customer_id: 1,
        reason: 'Product not delivered',
        status: 'open',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Disputes', {}, {});
  },
};