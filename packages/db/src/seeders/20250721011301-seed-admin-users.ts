import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('Admin_Users', [
      {
        email: 'admin@example.com',
        name: 'Super Admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'super_admin',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('Admin_Users', {}, {});
  },
};