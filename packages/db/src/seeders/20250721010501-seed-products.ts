import { QueryInterface } from "sequelize"
import { v4 as uuidv4 } from "uuid"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("PRODUCTS", [
      {
        id: 1001,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 1,
        name: "Smartphone X",
        description: "A powerful smartphone",
        price: 50000,
        stock_quantity: 100,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1002,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 2,
        name: "Smartphone Y",
        description: "Budget-friendly smartphone",
        price: 30000,
        stock_quantity: 150,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1003,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 1,
        name: "Laptop Pro 15",
        description: "High-performance laptop for professionals",
        price: 120000,
        stock_quantity: 50,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1004,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 3,
        name: "Wireless Earbuds",
        description: "Noise-canceling earbuds",
        price: 12000,
        stock_quantity: 200,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        id: 1005,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 4,
        name: "Smartwatch Z",
        description: "Fitness-focused smartwatch",
        price: 30000,
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
