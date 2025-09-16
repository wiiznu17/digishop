import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
  async up(q: QueryInterface): Promise<void> {
    const now = new Date();

    await q.bulkInsert("PRODUCT_ITEMS", [
      // Smartphone X (product_id: 1001)
      { uuid: uuidv4(), product_id: 1001, sku: "X-BLK-128", stock_quantity: 50,  price_minor: 4_999_000, is_enable: true, image_url: null, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_id: 1001, sku: "X-SLV-256", stock_quantity: 50,  price_minor: 5_499_000, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null },

      // Smartphone Y (1002)
      { uuid: uuidv4(), product_id: 1002, sku: "Y-BLU-64",  stock_quantity: 80,  price_minor: 2_999_000, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_id: 1002, sku: "Y-BLK-128", stock_quantity: 70,  price_minor: 3_199_000, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null },

      // Laptop Pro 15 (1003)
      { uuid: uuidv4(), product_id: 1003, sku: "L15-16-512", stock_quantity: 25, price_minor: 119_900_00, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null }, // 119,900.00
      { uuid: uuidv4(), product_id: 1003, sku: "L15-32-1TB", stock_quantity: 25, price_minor: 139_900_00, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null },  // 139,900.00

      // Wireless Earbuds (1004)
      { uuid: uuidv4(), product_id: 1004, sku: "EB-WHT",     stock_quantity: 120, price_minor: 1_199_000, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null },

      // Smartwatch Z (1005)
      { uuid: uuidv4(), product_id: 1005, sku: "SWZ-S",      stock_quantity: 25,  price_minor: 2_999_000, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_id: 1005, sku: "SWZ-M",      stock_quantity: 25,  price_minor: 2_999_000, is_enable: true,image_url: null, created_at: now, updated_at: now, deleted_at: null },
      { uuid: uuidv4(), product_id: 1005, sku: "SWZ-L",      stock_quantity: 25,  price_minor: 2_999_000, is_enable: false,image_url: null, created_at: now, updated_at: now, deleted_at: null },
    ]);
  },

  async down(q: QueryInterface): Promise<void> {
    await q.bulkDelete("PRODUCT_ITEMS", { product_id: [1001, 1002, 1003, 1004, 1005] }, {});
  },
};
