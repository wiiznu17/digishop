import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("ORDER_ITEMS", [
      // Order 6001 → Smartphone X (1001)
      {
        order_id: 6001,
        product_id: 1001,
        quantity: 1,
        unit_price: 500,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6002 → Smartphone Y (1002)
      {
        order_id: 6002,
        product_id: 1002,
        quantity: 2,
        unit_price: 500,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6003 → Laptop Pro 15 (1003)
      {
        order_id: 6003,
        product_id: 1003,
        quantity: 1,
        unit_price: 1200,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6004 → Wireless Earbuds (1004)
      {
        order_id: 6004,
        product_id: 1004,
        quantity: 3,
        unit_price: 150,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6005 → Smartwatch Z (1005)
      {
        order_id: 6005,
        product_id: 1005,
        quantity: 2,
        unit_price: 300,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6006 → Smartphone X + Earbuds
      {
        order_id: 6006,
        product_id: 1001,
        quantity: 1,
        unit_price: 500,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6006,
        product_id: 1004,
        quantity: 2,
        unit_price: 150,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6007 → Laptop Pro 15 + Smartwatch Z
      {
        order_id: 6007,
        product_id: 1003,
        quantity: 1,
        unit_price: 1200,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6007,
        product_id: 1005,
        quantity: 1,
        unit_price: 300,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6008 → Smartphone Y + Earbuds
      {
        order_id: 6008,
        product_id: 1002,
        quantity: 1,
        unit_price: 500,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6008,
        product_id: 1004,
        quantity: 1,
        unit_price: 150,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6009 → Laptop Pro 15
      {
        order_id: 6009,
        product_id: 1003,
        quantity: 2,
        unit_price: 1200,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },

      // Order 6010 → Smartwatch Z
      {
        order_id: 6010,
        product_id: 1005,
        quantity: 1,
        unit_price: 300,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("ORDER_ITEMS", {
      order_id: [6001,6002,6003,6004,6005,6006,6007,6008,6009,6010],
    });
  },
};
