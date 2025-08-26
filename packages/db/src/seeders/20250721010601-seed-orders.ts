import { QueryInterface } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date()

    // Orders (10 records manual)
    await queryInterface.bulkInsert("ORDERS", [
      {
        id: 6001,
        customer_id: 1,
        store_id: 1,
        total_price: 1200,
        status: "PENDING",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6002,
        customer_id: 1,
        store_id: 1,
        total_price: 2000,
        status: "CUSTOMER_CANCELED",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6003,
        customer_id: 1,
        store_id: 1,
        total_price: 3500,
        status: "PAID",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6004,
        customer_id: 1,
        store_id: 1,
        total_price: 4500,
        status: "PROCESSING",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6005,
        customer_id: 1,
        store_id: 1,
        total_price: 5600,
        status: "READY_TO_SHIP",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6006,
        customer_id: 1,
        store_id: 1,
        total_price: 2200,
        status: "SHIPPED",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6007,
        customer_id: 1,
        store_id: 1,
        total_price: 3200,
        status: "DELIVERED",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6008,
        customer_id: 1,
        store_id: 1,
        total_price: 2800,
        status: "COMPLETE",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6009,
        customer_id: 1,
        store_id: 1,
        total_price: 4100,
        status: "REFUND_REQUEST",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6010,
        customer_id: 1,
        store_id: 1,
        total_price: 5100,
        status: "REFUND_SUCCESS",
        created_at: now,
        updated_at: now,
      },
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("ORDERS", {
      id: [6001,6002,6003,6004,6005,6006,6007,6008,6009,6010]
    })
  },
}
