import { QueryInterface } from 'sequelize';
import { StoreStatus } from '../types/enum';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert('STORES', [
      {
        user_id: 2,
        store_name: 'Test Store 1',
        email: 'store1@example.com',
        phone: '0812345678',
        business_type: 'Retail',
        website: 'https://store1.example.com',
        logo_url: null,
        description: 'This is the first test store',
        status: StoreStatus.APPROVED,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        user_id: 3,
        store_name: 'Test Store 2',
        email: 'store2@example.com',
        phone: '0898765432',
        business_type: 'Wholesale',
        website: null,
        logo_url: null,
        description: 'Second store linked to same bank account',
        status: StoreStatus.APPROVED,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('STORES', {}, {});
  },
};
