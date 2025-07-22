import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert('ADDRESSES', [
      {
        user_id: 1,  // ต้องตรงกับ USERS.id
        recipient_name: 'Customer One',
        phone: '0812345678',
        address_line: '123 หมู่บ้านตัวอย่าง, แขวงบางซื่อ',
        province: 'กรุงเทพมหานคร',
        postal_code: '10800',
        is_default: true,
        address_type: 'HOME',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        user_id: 2,  // Merchant One
        recipient_name: 'Merchant One',
        phone: '0898765432',
        address_line: '99/9 อาคารการค้า, ถ.พระราม 9',
        province: 'กรุงเทพมหานคร',
        postal_code: '10310',
        is_default: false,
        address_type: 'OFFICE',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        user_id: 2,  // Merchant One
        recipient_name: 'C One',
        phone: '0983358976',
        address_line: '99/4 ดิจิโอ, ถ.พระราม 8',
        province: 'กรุงเทพมหานคร',
        postal_code: '10345',
        is_default: false,
        address_type: 'HOME',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('ADDRESSES', {}, {});
  },
};
