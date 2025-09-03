// src/seeders/20250828094500-seed-order-items-for-all-orders.ts
import { QueryInterface } from "sequelize";

// mapping ชื่อ/sku สำหรับ snapshot
const PRODUCT_META: Record<number, { name: string; sku: string }> = {
  1001: { name: "Smartphone X",      sku: "SKU-1001" },
  1002: { name: "Smartphone Y",      sku: "SKU-1002" },
  1003: { name: "Laptop Pro 15",     sku: "SKU-1003" },
  1004: { name: "Wireless Earbuds",  sku: "SKU-1004" },
  1005: { name: "Smartwatch Z",      sku: "SKU-1005" },
};

const minor = (baht: number) => Math.round(baht * 100);
const now = () => new Date();

function row(
  orderId: number,
  productId: number,
  quantity: number,
  unitPriceBaht: number
) {
  const meta = PRODUCT_META[productId] ?? {
    name: `Product #${productId}`,
    sku: `SKU-${productId}`,
  };
  const unitPriceMinor = minor(unitPriceBaht);

  return {
    order_id: orderId,
    product_id: productId,
    quantity,
    unit_price_minor: unitPriceMinor,
    discount_minor: 0,
    tax_rate: "0.0000",
    product_name_snapshot: meta.name,
    product_sku_snapshot: meta.sku,
    product_snapshot: JSON.stringify({
      id: productId,
      name: meta.name,
      sku: meta.sku,
      priceMinor: unitPriceMinor,
    }),
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
}

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("ORDER_ITEMS", [
      // 6001 = 1200
      row(6001, 1003, 1, 1200),

      // 6002 = 2000 (1200 + 500 + 300)
      row(6002, 1003, 1, 1200),
      row(6002, 1001, 1, 500),
      row(6002, 1005, 1, 300),

      // 6003 = 3500 (1200*2 + 500 + 300*2)
      row(6003, 1003, 2, 1200),
      row(6003, 1001, 1, 500),
      row(6003, 1005, 2, 300),

      // 6004 = 4500 (1200*3 + 300*3)
      row(6004, 1003, 3, 1200),
      row(6004, 1005, 3, 300),

      // 6005 = 5600 (1200*4 + 500 + 300)
      row(6005, 1003, 4, 1200),
      row(6005, 1001, 1, 500),
      row(6005, 1005, 1, 300),

      // 6006 = 2300 (1200 + 500 + 300*2)
      row(6006, 1003, 1, 1200),
      row(6006, 1001, 1, 500),
      row(6006, 1005, 2, 300),

      // 6007 = 2200 (1200 + 500 + 500)
      row(6007, 1003, 1, 1200),
      row(6007, 1001, 1, 500),
      row(6007, 1002, 1, 500),

      // 6008 = 3200 (1200*2 + 500 + 300)
      row(6008, 1003, 2, 1200),
      row(6008, 1001, 1, 500),
      row(6008, 1005, 1, 300),

      // 6009 = 2800 (1200 + 500*2 + 300*2)
      row(6009, 1003, 1, 1200),
      row(6009, 1001, 1, 500),
      row(6009, 1002, 1, 500),
      row(6009, 1005, 2, 300),

      // 6010 = 3100 (1200 + 500*2 + 300*3)
      row(6010, 1003, 1, 1200),
      row(6010, 1001, 1, 500),
      row(6010, 1002, 1, 500),
      row(6010, 1005, 3, 300),

      // 6011 = 1900 (500*2 + 300*3)
      row(6011, 1001, 1, 500),
      row(6011, 1002, 1, 500),
      row(6011, 1005, 3, 300),

      // 6012 = 1950 (1200 + 300*2 + 150)
      row(6012, 1003, 1, 1200),
      row(6012, 1005, 2, 300),
      row(6012, 1004, 1, 150),

      // 6013 = 4100 (1200*3 + 500)
      row(6013, 1003, 3, 1200),
      row(6013, 1001, 1, 500),

      // 6014 = 2500 (1200 + 500*2 + 300)
      row(6014, 1003, 1, 1200),
      row(6014, 1001, 1, 500),
      row(6014, 1002, 1, 500),
      row(6014, 1005, 1, 300),

      // 6015 = 2550 (1200*2 + 150)
      row(6015, 1003, 2, 1200),
      row(6015, 1004, 1, 150),

      // 6016 = 2600 (1200 + 500 + 300*3)
      row(6016, 1003, 1, 1200),
      row(6016, 1001, 1, 500),
      row(6016, 1005, 3, 300),

      // 6017 = 2650 (1200 + 500*2 + 300 + 150)
      row(6017, 1003, 1, 1200),
      row(6017, 1001, 1, 500),
      row(6017, 1002, 1, 500),
      row(6017, 1005, 1, 300),
      row(6017, 1004, 1, 150),

      // 6018 = 4200 (1200*3 + 300*2)
      row(6018, 1003, 3, 1200),
      row(6018, 1005, 2, 300),

      // 6019 = 4300 (1200*2 + 500*2 + 300*3)
      row(6019, 1003, 2, 1200),
      row(6019, 1001, 1, 500),
      row(6019, 1002, 1, 500),
      row(6019, 1005, 3, 300),

      // 6020 = 5100 (1200*4 + 300)
      row(6020, 1003, 4, 1200),
      row(6020, 1005, 1, 300),

      // 6021 = 4400 (1200*3 + 500 + 300)
      row(6021, 1003, 3, 1200),
      row(6021, 1001, 1, 500),
      row(6021, 1005, 1, 300),
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("ORDER_ITEMS", {
      order_id: [
        6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010,
        6011, 6012, 6013, 6014, 6015, 6016, 6017, 6018, 6019, 6020, 6021,
      ],
    });
  },
};
