import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('REVIEWS', [
      {
        user_id: 1,
        product_id: 1,
        order_id: 1,
        rating: 5,
        comment: 'Great product!',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Reviews', {}, {});
  },
};