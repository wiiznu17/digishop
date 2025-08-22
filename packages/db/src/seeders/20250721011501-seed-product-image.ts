import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert('PRODUCT_IMAGES', [
      {
        id: 'b1111111-aaaa-bbbb-cccc-111111111111',
        productId: '1', // ตรวจสอบให้มี productId นี้ใน DB
        url: 'https://example.com/images/product1-main.jpg',
        blobName: 'product1-main.jpg',
        fileName: 'product1-main.jpg',
        isMain: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'b2222222-aaaa-bbbb-cccc-222222222222',
        productId: '1',
        url: 'https://example.com/images/product1-side.jpg',
        blobName: 'product1-side.jpg',
        fileName: 'product1-side.jpg',
        isMain: false,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'b3333333-aaaa-bbbb-cccc-333333333333',
        productId: '2',
        url: 'https://example.com/images/product2-main.jpg',
        blobName: 'product2-main.jpg',
        fileName: 'product2-main.jpg',
        isMain: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('PRODUCT_IMAGES', {}, {});
  },
};
