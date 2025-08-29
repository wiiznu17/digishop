// src/seeders/2025xxxx-seed-refund-images.ts
import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("REFUND_IMAGES", [
      {
        // id auto-increment
        refund_order_id: 1, // ตรงกับ seed ของ REFUND_ORDERS ลำดับแรก
        url: "https://example.com/refund/1/photo-1.jpg",
        blob_name: "refund/1/photo-1.jpg",
        file_name: "photo-1.jpg",
        is_main: true,
        order: 0,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      {
        refund_order_id: 1,
        url: "https://example.com/refund/1/photo-2.jpg",
        blob_name: "refund/1/photo-2.jpg",
        file_name: "photo-2.jpg",
        is_main: false,
        order: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("REFUND_IMAGES", {
      refund_order_id: [1],
    });
  },
};
