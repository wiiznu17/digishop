import { QueryInterface } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("PRODUCTS", [
      {
        id: 1001,
        store_id: 1,
        category_id: 1,
        name: "Smartphone X",
        description: "A powerful smartphone",
        price: 500,
        stock_quantity: 100,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1002,
        store_id: 1,
        category_id: 2,
        name: "Smartphone Y",
        description: "Budget-friendly smartphone",
        price: 300,
        stock_quantity: 150,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1003,
        store_id: 1,
        category_id: 1,
        name: "Laptop Pro 15",
        description: "High-performance laptop for professionals",
        price: 1200,
        stock_quantity: 50,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1004,
        store_id: 1,
        category_id: 3,
        name: "Wireless Earbuds",
        description: "Noise-canceling earbuds",
        price: 120,
        stock_quantity: 200,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1005,
        store_id: 1,
        category_id: 4,
        name: "Smartwatch Z",
        description: "Fitness-focused smartwatch",
        price: 300,
        stock_quantity: 75,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("PRODUCTS", {
      id: [1001, 1002, 1003, 1004, 1005],
    })
  },
}
