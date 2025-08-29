import { QueryInterface } from "sequelize";

const now = new Date();

// helper สำหรับ snapshot
const shipSnap = (typeId: 1 | 2) =>
  typeId === 1
    ? { name: "STANDARD", priceMinor: 5000 } // 50.00
    : { name: "EXPRESS",  priceMinor: 10000 }; // 100.00

// mock address snapshot (ให้ตรง schema ADDRESSES ของคุณ)
const addrSnap = (id: number) => ({
  id,
  recipient_name: "John Doe",
  phone: "0800000000",
  address_number: "123/45",
  building: null,
  sub_street: null,
  street: "Main Rd.",
  sub_district: "Sub",
  district: "District",
  province: "Bangkok",
  postal_code: "10000",
  country: "TH",
});

const row = (
  orderId: number,
  typeId: 1 | 2,
  status:
    | "PENDING"
    | "RECIEVE_PARCEL"
    | "IN_TRANSIT"
    | "CUSTOMER_REJECT"
    | "TRANSIT_ISSUE"
    | "RE_TRANSIT"
    | "DELIVERED",
  shippedAt: Date | null
) => {
  const s = shipSnap(typeId);
  const tracking = `TRK${orderId}`;
  const addressId = 1;

  return {
    order_id: orderId,
    tracking_number: tracking,
    carrier: typeId === 1 ? "DHL" : "Kerry",
    shipping_type_id: typeId,
    shipping_status: status,
    shipping_address: addressId,
    shipped_at: shippedAt,

    // ⬇️ snapshots
    shipping_type_name_snapshot: s.name,
    shipping_price_minor_snapshot: s.priceMinor,
    address_snapshot: JSON.stringify(addrSnap(addressId)),

    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
};

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("SHIPPING_INFO", [
      row(6001, 1, "PENDING",       now),
      row(6002, 2, "PENDING",       now),
      row(6003, 1, "PENDING",       now),
      row(6004, 2, "PENDING",       now),
      row(6005, 1, "PENDING",       null),
      row(6006, 2, "RECIEVE_PARCEL",now),
      row(6007, 1, "IN_TRANSIT",    now),
      row(6008, 2, "DELIVERED",     now),
      row(6009, 1, "DELIVERED",     null),
      row(6010, 2, "PENDING",       now),
      row(6011, 2, "TRANSIT_ISSUE", now),
      row(6012, 2, "RE_TRANSIT",    now),
      row(6013, 2, "PENDING",       now),
      row(6014, 2, "DELIVERED",     now),
      row(6015, 2, "DELIVERED",     now),
      row(6016, 2, "DELIVERED",     now),
      row(6017, 2, "DELIVERED",     now),
      row(6018, 2, "PENDING",       now),
      row(6019, 2, "PENDING",       now),
      row(6020, 2, "PENDING",       now),
      row(6021, 2, "PENDING",       now),
      row(6022, 2, "DELIVERED",     now),
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("SHIPPING_INFO", {
      order_id: [
        6001,6002,6003,6004,6005,6006,6007,6008,6009,6010,
        6011,6012,6013,6014,6015,6016,6017,6018,6019,6020,6021,6022
      ],
    });
  },
};
