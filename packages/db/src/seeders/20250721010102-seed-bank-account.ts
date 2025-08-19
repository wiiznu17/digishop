import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert('BANK_ACCOUNTS', [
      {
        bank_name: 'Bangkok Bank',
        account_number: '123-456-7890',
        account_holder_name: 'Test Merchant',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'Kasikorn Bank',
        account_number: '987-654-3210',
        account_holder_name: 'Test Merchant 2',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'SCB',
        account_number: '111-222-3333',
        account_holder_name: 'Merchant 3',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'Krungsri',
        account_number: '444-555-6666',
        account_holder_name: 'Merchant 4',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'TMBThanachart Bank',
        account_number: '777-888-9999',
        account_holder_name: 'Merchant 5',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'Government Savings Bank',
        account_number: '000-111-2222',
        account_holder_name: 'Merchant 6',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'Krungthai Bank',
        account_number: '333-444-5555',
        account_holder_name: 'Merchant 7',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'CIMB Thai Bank',
        account_number: '666-777-8888',
        account_holder_name: 'Merchant 8',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'United Overseas Bank',
        account_number: '999-000-1111',
        account_holder_name: 'Merchant 9',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'Standard Chartered Bank',
        account_number: '222-333-4444',
        account_holder_name: 'Merchant 10',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'Mega International Commercial Bank',
        account_number: '555-666-7777',
        account_holder_name: 'Merchant 11',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        bank_name: 'Bank of China',
        account_number: '888-999-0000',
        account_holder_name: 'Merchant 12',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('BANK_ACCOUNTS', {}, {});
  },
};
