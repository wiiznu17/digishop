import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert('USERS', [
      {
        email: 'customer1@example.com',
        password: '1234',
        first_name: 'Customer',
        last_name: 'One',
        middle_name: 'God',
        role: 'customer',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        email: 'merchant1@example.com',
        password: '1234',
        first_name: 'Merchant',
        last_name: 'Two',
        middle_name: 'Seller',
        role: 'merchant',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        email: 'merchant2@example.com',
        password: '1234',
        first_name: 'Merchant',
        last_name: 'Three',
        middle_name: 'Seller',
        role: 'merchant',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('USERS', {}, {});
  },
};
