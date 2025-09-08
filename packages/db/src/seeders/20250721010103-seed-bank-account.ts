import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    
    await queryInterface.bulkInsert('BANK_ACCOUNTS', [
      // --- บัญชีสำหรับร้านค้า ID 1 ---
      {
        store_id: 1,
        is_default: true,
        bank_name: 'Bangkok Bank',
        account_number: '123-456-7890',
        account_holder_name: 'Test Merchant Store 1',
        status: 'VERIFIED',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        store_id: 1,
        is_default: false,
        bank_name: 'Kasikorn Bank',
        account_number: '987-654-3210',
        account_holder_name: 'Test Merchant Store 1',
        status: 'VERIFIED',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        store_id: 1,
        is_default: false,
        bank_name: 'Krungthai Bank',
        account_number: '333-444-5555',
        account_holder_name: 'Test Merchant Store 1',
        status: 'VERIFIED',
        created_at: new Date(),
        updated_at: new Date(),
      },

      // --- บัญชีสำหรับร้านค้า ID 2 ---
      {
        store_id: 2,
        is_default: true,
        bank_name: 'SCB',
        account_number: '111-222-3333',
        account_holder_name: 'Another Merchant Store 2',
        status: 'VERIFIED',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        store_id: 2,
        is_default: false,
        bank_name: 'Krungsri',
        account_number: '444-555-6666',
        account_holder_name: 'Another Merchant Store 2',
        status: 'VERIFIED',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        store_id: 2,
        is_default: false,
        bank_name: 'TMBThanachart Bank',
        account_number: '777-888-9999',
        account_holder_name: 'Third Store Owner',
        status: 'VERIFIED',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('BANK_ACCOUNTS', {}, {});
  },
};