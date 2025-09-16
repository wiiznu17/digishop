// src/seeders/20250828094000-seed-orders-all-statuses.ts
import { QueryInterface } from "sequelize";

const SNAP = {
  customerName: "Alice Customer",
  customerEmail: "alice@example.com",
  storeName: "Demo Store",
};
const CCY = "THB";

// helper: from legacy total_price (baht) -> minor fields
const minor = (baht: number) => Math.round(baht * 100);

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();

    const rows = [
      // id, code, price, status, note?
      [6001,1 ,"DGS2025082801", 1200, "PENDING", "Please deliver between 9 AM to 5 PM."],
      [6002,2 ,"DGS2025082802", 2000, "CUSTOMER_CANCELED"],
      [6003,3 ,"DGS2025082803", 3500, "PAID"],
      [6004,4,"DGS2025082804", 4500, "PROCESSING", "Gift wrap this item, please."],
      [6005,5,"DGS2025082805", 5600, "READY_TO_SHIP"],
      [6006,6,"DGS2025082806", 2300, "HANDED_OVER"],
      [6007,7,"DGS2025082807", 2200, "SHIPPED"],
      [6008,8,"DGS2025082808", 3200, "DELIVERED"],
      [6009,9,"DGS2025082809", 2800, "COMPLETE"],
      [6010,10,"DGS2025082810", 3100, "MERCHANT_CANCELED"],
      [6011,11,"DGS2025082811", 1900, "TRANSIT_LACK"],
      [6012,12,"DGS2025082812", 1950, "RE_TRANSIT"],
      [6013,13,"DGS2025082813", 4100, "REFUND_REQUEST"],
      [6014,14,"DGS2025082814", 2500, "AWAITING_RETURN"],
      [6015,15,"DGS2025082815", 2550, "RECEIVE_RETURN"],
      [6016,16,"DGS2025082816", 2600, "RETURN_VERIFIED"],
      [6017,17,"DGS2025082817", 2650, "RETURN_FAIL"],
      [6018,18,"DGS2025082818", 4200, "REFUND_REJECTED"],
      [6019,19,"DGS2025082819", 4300, "REFUND_APPROVED"],
      [6020,20,"DGS2025082820", 5100, "REFUND_SUCCESS"],
      [6021,21,"DGS2025082821", 4400, "REFUND_FAIL"],
      [6022,22,"DGS2125082813", 4100, "REFUND_REQUEST"],
    ] as const;

    await queryInterface.bulkInsert(
      "ORDERS",
      rows.map(([id, checkout,code, price, status, note]) => {
        const grand = minor(price);
        return {
          id,
          checkout_id: checkout,
          store_id: 1,
          reference: `REF${code.slice(-9)}`, // สร้างอิงง่าย ๆ ให้ไม่ชน
          // amounts (set component = 0 ทั้งหมด เพื่อให้รวม = grand)
          subtotal_minor: grand,
          shipping_fee_minor: 0,
          tax_total_minor: 0,
          discount_total_minor: 0,
          grand_total_minor: grand,
          currency_code: CCY,

          status,
          order_note: note ?? null,

          // snapshots
          customer_name_snapshot: SNAP.customerName,
          customer_email_snapshot: SNAP.customerEmail,
          store_name_snapshot: SNAP.storeName,

          idempotency_key: null,
          correlation_id: null,

          created_at: now,
          updated_at: now,
          deleted_at: null,
        };
      })
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("ORDERS", {
      id: [
        6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010,
        6011, 6012, 6013, 6014, 6015, 6016, 6017, 6018, 6019, 6020, 6021, 6022,
      ],
    });
  },
};
