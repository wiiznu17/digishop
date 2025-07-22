import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Order_Items', [
      {
        order_id: 1,
        product_id: 1,
        quantity: 1,
        unit_price: 599.99,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Order_Items', {}, {});
  },
};