import { QueryInterface } from 'sequelize';
import { ShippingType } from '../types/enum';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('SHIPPING_CONFIGS', [
      {
        store_id: 1,
        carrier: 'DHL',
        shipping_type: ShippingType.STANDARD,
        pickup_time: '10:00:00',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        store_id: 1,
        carrier: 'FedEx',
        shipping_type: ShippingType.EXPRESS,
        pickup_time: '14:00:00',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Shipping_Configs', {}, {});
  },
};