import { QueryInterface } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date()

    // Orders (10 records manual)
    await queryInterface.bulkInsert("ORDERS", [
      {
        id: 6001,
        order_code: 'DGS2025270811',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289271',
        total_price: 1200,
        status: "PENDING",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6002,
        order_code: 'DGS2025270812',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289272',
        total_price: 2000,
        status: "CUSTOMER_CANCELED",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6003,
        order_code: 'DGS2025270813',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289273',
        total_price: 3500,
        status: "PAID",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6004,
        order_code: 'DGS2025270813',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289274',
        total_price: 4500,
        status: "PROCESSING",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6005,
        order_code: 'DGS2025270814',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289275',
        total_price: 5600,
        status: "READY_TO_SHIP",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6006,
        order_code: 'DGS2025270815',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289276',
        total_price: 2200,
        status: "SHIPPED",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6007,
        order_code: 'DGS2025270816',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289277',
        total_price: 3200,
        status: "DELIVERED",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6008,
        order_code: 'DGS2025270817',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289278',
        total_price: 2800,
        status: "COMPLETE",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6009,
        order_code: 'DGS2025270818',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289279',
        total_price: 4100,
        status: "REFUND_REQUEST",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6010,
        order_code: 'DGS2025270819',
        customer_id: 1,
        store_id: 1,
        reference: '20210316182209289270',
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
