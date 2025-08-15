import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Orders', [
      {
        customer_id: 1,
        store_id: 1,
        total_price: 599.99,
        shippingAddress: 1,
        status: 'pending',
        paymentMethod: 'Credit Card',
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