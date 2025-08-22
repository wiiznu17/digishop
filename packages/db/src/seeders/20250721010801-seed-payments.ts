import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('PAYMENTS', [
      {
        order_id: 1,
        payment_method: 'CREDIT_CARD',
        status: 'success',
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Payments', {}, {});
  },
};