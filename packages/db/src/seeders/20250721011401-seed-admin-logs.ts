import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Admin_System_Logs', [
      {
        admin_id: 1,
        action: 'CREATE_USER',
        target_entity: 'User',
        target_id: 1,
        timestamp: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Admin_System_Logs', {}, {});
  },
};