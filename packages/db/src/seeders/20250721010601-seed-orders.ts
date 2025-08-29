// src/seeders/20250828094000-seed-orders-all-statuses.ts
import { QueryInterface } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date()

    await queryInterface.bulkInsert("ORDERS", [
      // 1) PENDING
      {
        id: 6001,
        order_code: "DGS2025082801",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280001",
        order_note: "Please deliver between 9 AM to 5 PM.",
        total_price: 1200,
        status: "PENDING",
        created_at: now,
        updated_at: now,
      },
      // 2) CUSTOMER_CANCELED
      {
        id: 6002,
        order_code: "DGS2025082802",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280002",
        total_price: 2000,
        status: "CUSTOMER_CANCELED",
        created_at: now,
        updated_at: now,
      },
      // 3) PAID
      {
        id: 6003,
        order_code: "DGS2025082803",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280003",
        total_price: 3500,
        status: "PAID",
        created_at: now,
        updated_at: now,
      },
      // 4) PROCESSING
      {
        id: 6004,
        order_code: "DGS2025082804",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280004",
        order_note: "Gift wrap this item, please.",
        total_price: 4500,
        status: "PROCESSING",
        created_at: now,
        updated_at: now,
      },
      // 5) READY_TO_SHIP
      {
        id: 6005,
        order_code: "DGS2025082805",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280005",
        total_price: 5600,
        status: "READY_TO_SHIP",
        created_at: now,
        updated_at: now,
      },
      // 6) HANDED_OVER
      {
        id: 6006,
        order_code: "DGS2025082806",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280006",
        total_price: 2300,
        status: "HANDED_OVER",
        created_at: now,
        updated_at: now,
      },
      // 7) SHIPPED
      {
        id: 6007,
        order_code: "DGS2025082807",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280007",
        total_price: 2200,
        status: "SHIPPED",
        created_at: now,
        updated_at: now,
      },
      // 8) DELIVERED
      {
        id: 6008,
        order_code: "DGS2025082808",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280008",
        total_price: 3200,
        status: "DELIVERED",
        created_at: now,
        updated_at: now,
      },
      // 9) COMPLETE
      {
        id: 6009,
        order_code: "DGS2025082809",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280009",
        total_price: 2800,
        status: "COMPLETE",
        created_at: now,
        updated_at: now,
      },
      // 10) MERCHANT_CANCELED
      {
        id: 6010,
        order_code: "DGS2025082810",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280010",
        total_price: 3100,
        status: "MERCHANT_CANCELED",
        created_at: now,
        updated_at: now,
      },
      // 11) TRANSIT_LACK
      {
        id: 6011,
        order_code: "DGS2025082811",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280011",
        total_price: 1900,
        status: "TRANSIT_LACK",
        created_at: now,
        updated_at: now,
      },
      // 12) RE_TRANSIT
      {
        id: 6012,
        order_code: "DGS2025082812",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280012",
        total_price: 1950,
        status: "RE_TRANSIT",
        created_at: now,
        updated_at: now,
      },
      // 13) REFUND_REQUEST
      {
        id: 6013,
        order_code: "DGS2025082813",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280013",
        total_price: 4100,
        status: "REFUND_REQUEST",
        created_at: now,
        updated_at: now,
      },
      // 14) AWAITING_RETURN
      {
        id: 6014,
        order_code: "DGS2025082814",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280014",
        total_price: 2500,
        status: "AWAITING_RETURN",
        created_at: now,
        updated_at: now,
      },
      // 15) RECEIVE_RETURN
      {
        id: 6015,
        order_code: "DGS2025082815",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280015",
        total_price: 2550,
        status: "RECEIVE_RETURN",
        created_at: now,
        updated_at: now,
      },
      // 16) RETURN_VERIFIED
      {
        id: 6016,
        order_code: "DGS2025082816",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280016",
        total_price: 2600,
        status: "RETURN_VERIFIED",
        created_at: now,
        updated_at: now,
      },
      // 17) RETURN_FAIL
      {
        id: 6017,
        order_code: "DGS2025082817",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280017",
        total_price: 2650,
        status: "RETURN_FAIL",
        created_at: now,
        updated_at: now,
      },
      // 18) REFUND_REJECTED (ใหม่)
      {
        id: 6018,
        order_code: "DGS2025082818",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280018",
        total_price: 4200,
        status: "REFUND_REJECTED",
        created_at: now,
        updated_at: now,
      },
      // 19) REFUND_APPROVED
      {
        id: 6019,
        order_code: "DGS2025082819",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280019",
        total_price: 4300,
        status: "REFUND_APPROVED",
        created_at: now,
        updated_at: now,
      },
      // 20) REFUND_SUCCESS
      {
        id: 6020,
        order_code: "DGS2025082820",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280020",
        total_price: 5100,
        status: "REFUND_SUCCESS",
        created_at: now,
        updated_at: now,
      },
      // 21) REFUND_FAIL
      {
        id: 6021,
        order_code: "DGS2025082821",
        customer_id: 1,
        store_id: 1,
        reference: "REF202508280021",
        total_price: 4400,
        status: "REFUND_FAIL",
        created_at: now,
        updated_at: now,
      },
      {
        id: 6022,
        order_code: "DGS2125082813",
        customer_id: 1,
        store_id: 1,
        reference: "REF212508280013",
        total_price: 4100,
        status: "REFUND_REQUEST",
        created_at: now,
        updated_at: now,
      },
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("ORDERS", {
      id: [
        6001,6002,6003,6004,6005,6006,6007,6008,6009,6010,
        6011,6012,6013,6014,6015,6016,6017,6018,6019,6020,6021,6022
      ],
    })
  },
}
