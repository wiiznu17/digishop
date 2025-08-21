import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert('ADDRESSES', [
      {
        user_id: 1,  // ต้องตรงกับ USERS.id
        recipient_name: 'Customer One',
        phone: '0812345678',
        address_number: '123/4',
        building: 'อาคารพาณิชย์',
        sub_street: 'ซอยสุขุมวิท 1',
        street: 'ถนนสุขุมวิท',
        sub_district: 'คลองเตย',
        district: 'คลองเตย',
        province: 'กรุงเทพมหานคร',
        postal_code: '10800',
        country: 'Thailand',
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
        address_number: '123/4',
        building: 'อาคารพาณิชย์',
        sub_street: 'ซอยสุขุมวิท 1',
        street: 'ถนนสุขุมวิท',
        sub_district: 'คลองเตย',
        district: 'คลองเตย',
        province: 'กรุงเทพมหานคร',
        postal_code: '10310',
        country: 'Thailand',
        is_default: true,
        address_type: 'OFFICE',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        user_id: 2,  // Merchant One
        recipient_name: 'C One',
        phone: '0983358976',
        address_number: '123/4',
        building: 'อาคารพาณิชย์',
        sub_street: 'ซอยสุขุมวิท 1',
        street: 'ถนนสุขุมวิท',
        sub_district: 'คลองเตย',
        district: 'คลองเตย',
        province: 'กรุงเทพมหานคร',
        postal_code: '10345',
        country: 'Thailand',
        is_default: false,
        address_type: 'HOME',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        user_id: 3,  // Merchant One
        recipient_name: 'C One',
        phone: '0983358976',
        address_number: '123/4',
        building: 'อาคารพาณิชย์',
        sub_street: 'ซอยสุขุมวิท 1',
        street: 'ถนนสุขุมวิท',
        sub_district: 'คลองเตย',
        district: 'คลองเตย',
        province: 'กรุงเทพมหานคร',
        postal_code: '10345',
        country: 'Thailand',
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
