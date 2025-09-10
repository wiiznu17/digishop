import { QueryInterface } from "sequelize"
import { v4 as uuidv4 } from "uuid"
const now = new Date();
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("PRODUCT_ITEMS", [
      {
        id: 1001,
        product_id:1004,
        sku: 'WE-01',
        stock_quantity: 10,
        price_minor: 200000,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        id: 1002,
        product_id:1004,
        sku: 'WE-02',
        stock_quantity: 10,
        price_minor: 300000,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("PRODUCT_ITEMS", {
      id: [1001, 1002],
    })
  },
}
