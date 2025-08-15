import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert('ShippingTypes', [
      {
        name: 'Standard Shipping',
        description: 'Delivery within 3-5 business days',
        estimatedDays: 5,
        price: 50.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Express Shipping',
        description: 'Delivery within 1-2 business days',
        estimatedDays: 2,
        price: 150.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('ShippingTypes', {}, {});
  },
};
