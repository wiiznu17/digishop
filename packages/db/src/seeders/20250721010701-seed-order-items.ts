import { QueryInterface } from "sequelize";

// mapping ชื่อสินค้า
const PRODUCT_NAME: Record<number, string> = {
  1001: "Smartphone X",
  1003: "Laptop Pro 15",
  1004: "Wireless Earbuds",
};

// mapping sku ตาม product_item_id
const PRODUCT_ITEM_SKU: Record<number, string> = {
  // 1001
  1: "X-BLK-128",
  2: "X-SLV-256",
  3: "X-BLK-128",
  4: "X-SLV-256",
  // 1002
  5: "Y-BLU",
  6: "Y-BLU",
  // 1003
  7: "L15-16-512",
  8: "L15-32-1TB",
  9: "L15-32-512",
  10: "L15-16-1TB",
  // 1004
  11: "EB-WHT",
  // 1005
  12: "SWZ-S",
  13: "SWZ-M",
  14: "SWZ-L"
};

const minor = (baht: number) => Math.round(baht * 100);
const now = () => new Date();

function row(
  orderId: number,
  productId: number,
  productItemId: number,
  quantity: number,
  unitPriceBaht: number
) {
  const name = PRODUCT_NAME[productId] ?? `Product #${productId}`;
  const sku = PRODUCT_ITEM_SKU[productItemId] ?? `SKU-${productItemId}`;
  const unitPriceMinor = minor(unitPriceBaht);
  const lineTotalMinor = unitPriceMinor * quantity;

  return {
    order_id: orderId,
    product_id: productId,
    product_item_id: productItemId,
    quantity,
    unit_price_minor: unitPriceMinor,
    discount_minor: 0,
    tax_rate: "0.0000",
    line_total_minor: lineTotalMinor,
    product_name_snapshot: name,
    product_sku_snapshot: sku,
    product_snapshot: JSON.stringify({
      id: productId,
      itemId: productItemId,
      name,
      sku,
      priceMinor: unitPriceMinor,
    }),
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  };
}

export default {
  up: async (queryInterface: QueryInterface) => {
    // - ทุกออเดอร์ store_id = 1 

    await queryInterface.bulkInsert("ORDER_ITEMS", [
      // 6001 = 1200
      row(6001, 1003, 7, 1, 1200),

      // 6002 = 2000 (1200 + 500 + 300 -> 300 = 150*2)
      row(6002, 1003, 8, 1, 1200),
      row(6002, 1001, 1, 1, 500),
      row(6002, 1004, 11, 2, 150),

      // 6003 = 3500 (1200*2 + 500 + 300*2 -> 300 = 150*2)
      row(6003, 1003, 8, 2, 1200),
      row(6003, 1001, 1, 1, 500),
      row(6003, 1004, 11, 4, 150),

      // 6004 = 4500 (1200*3 + 300*3 -> 300 = 150*2, รวมเป็น 150*6)
      row(6004, 1003, 9, 3, 1200),
      row(6004, 1004, 11, 6, 150),

      // 6005 = 5600 (1200*4 + 500 + 300 -> 300 = 150*2)
      row(6005, 1003, 7, 4, 1200),
      row(6005, 1001, 1, 1, 500),
      row(6005, 1004, 11, 2, 150),

      // 6006 = 2300 (1200 + 500 + 300*2 -> 300 = 150*2 → *2 = 150*4)
      row(6006, 1003, 9, 1, 1200),
      row(6006, 1001, 1, 1, 500),
      row(6006, 1004, 11, 4, 150),

      // 6007 = 2200 (1200 + 500 + 500)
      row(6007, 1003, 9, 1, 1200),
      row(6007, 1001, 1, 2, 500),

      // 6008 = 3200 (1200*2 + 500 + 300 -> 150*2)
      row(6008, 1003, 8, 2, 1200),
      row(6008, 1001, 1, 1, 500),
      row(6008, 1004, 11, 2, 150),

      // 6009 = 2800 (1200 + 500*2 + 300*2 -> 150*4)
      row(6009, 1003, 7, 1, 1200),
      row(6009, 1001, 1, 2, 500),
      row(6009, 1004, 11, 4, 150),

      // 6010 = 3100 (1200 + 500*2 + 300*3 -> 150*6)
      row(6010, 1003, 7, 1, 1200),
      row(6010, 1001, 1, 2, 500),
      row(6010, 1004, 11, 6, 150),

      // 6011 = 1900 (500*2 + 300*3 -> 150*6 = 900; 500*2 = 1000; รวม 1900)
      row(6011, 1001, 1, 2, 500),
      row(6011, 1004, 11, 6, 150),

      // 6012 = 1950 (1200 + 150*5)
      row(6012, 1003, 8, 1, 1200),
      row(6012, 1004, 7, 5, 150),

      // 6013 = 4100 (1200*3 + 500)
      row(6013, 1003, 10, 3, 1200),
      row(6013, 1001, 1, 1, 500),

      // 6014 = 2500 (1200 + 500*2 + 300 -> 150*2)
      row(6014, 1003, 9, 1, 1200),
      row(6014, 1001, 1, 2, 500),
      row(6014, 1004, 11, 2, 150),

      // 6015 = 2550 (1200*2 + 150)
      row(6015, 1003, 7, 2, 1200),
      row(6015, 1004, 11, 1, 150),

      // 6016 = 2600 (1200 + 500 + 300*3 -> 150*6)
      row(6016, 1003, 9, 1, 1200),
      row(6016, 1001, 1, 1, 500),
      row(6016, 1004, 11, 6, 150),

      // 6017 = 2650 (1200 + 500*2 + 300 + 150 -> 300 = 150*2)
      row(6017, 1003, 8, 1, 1200),
      row(6017, 1001, 1, 2, 500),
      row(6017, 1004, 11, 3, 150),

      // 6018 = 4200 (1200*3 + 300*2 -> 150*4)
      row(6018, 1003, 8, 3, 1200),
      row(6018, 1004, 11, 4, 150),

      // 6019 = 4300 (1200*2 + 500*2 + 300*3 -> 150*6)
      row(6019, 1003, 7, 2, 1200),
      row(6019, 1001, 1, 2, 500),
      row(6019, 1004, 11, 6, 150),

      // 6020 = 5100 (1200*4 + 300 -> 150*2)
      row(6020, 1003, 9, 4, 1200),
      row(6020, 1004, 11, 2, 150),

      // 6021 = 4400 (1200*3 + 500 + 300 -> 150*2)
      row(6021, 1003, 9, 3, 1200),
      row(6021, 1001, 1, 1, 500),
      row(6021, 1004, 11, 2, 150),

      // 6022 = 4100 (500*7 + 150*4)
      row(6022, 1001, 1, 7, 500),
      row(6022, 1004, 11, 4, 150),
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
