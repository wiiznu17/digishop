import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from 'uuid'

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert("profile_images", [
      {
        uuid: uuidv4(),
        store_id: 1,
        url: 'https://digishop.blob.core.windows.net/product/products/9ddb9d37-69ec-4725-8ae1-203c838ea093/items/4def94a4-5720-4945-aaf9-415f15c87863/d047e37a-02fc-4205-b583-b97c71d2e3fb.jpg',
        blobName: "store1-main-blob",
        fileName: "store1-main.jpg",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        uuid: uuidv4(),
        store_id: 1,
        url: 'https://digishop.blob.core.windows.net/product/products/9ddb9d37-69ec-4725-8ae1-203c838ea093/items/4def94a4-5720-4945-aaf9-415f15c87863/d047e37a-02fc-4205-b583-b97c71d2e3fb.jpg',
        blobName: "store1-secondary-blob",
        fileName: "store1-secondary.jpg",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("profile_images", {}, {});
  },
};
