import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('STORE_VIEWS', [
      {
        store_id: 1,
        user_id: 1,
        session_id: 'sess124',
        viewed_at: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Store_Views', {}, {});
  },
};