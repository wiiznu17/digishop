import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Stores', [
      {
        user_id: 2,
        store_name: 'Jane Shop',
        logo_url: 'https://example.com/logo.png',
        description: 'Best shop in town',
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Stores', {}, {});
  },
};