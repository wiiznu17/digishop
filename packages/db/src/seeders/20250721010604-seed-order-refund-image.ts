// src/seeders/20250828093000-seed-refund-images.ts
import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert("REFUND_IMAGES", [
      {
        id: "9a3b9f2e-7a21-4c9e-bcf2-111111111111",
        refund_order_id: 1,
        url: "https://example.com/refund/1/photo-1.jpg",
        blob_name: "refund/1/photo-1.jpg",
        file_name: "photo-1.jpg",
        is_main: true,
        order: 0,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("REFUND_IMAGES", {}, {});
  },
};
