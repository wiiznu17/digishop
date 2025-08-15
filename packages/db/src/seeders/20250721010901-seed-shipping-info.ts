import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Shipping_Info', [
      {
        order_id: 1,
        tracking_number: 'TRK123456789',
        carrier: 'DHL',
        shipping_type_id: 1,
        shipping_status: 'processing',
        shipped_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Shipping_Info', {}, {});
  },
};