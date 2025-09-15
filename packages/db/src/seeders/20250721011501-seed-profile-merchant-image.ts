import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from 'uuid'

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert("profile_images", [
      {
        uuid: uuidv4(),
        store_id: 1,
        url: "https://example.com/images/store1-main.jpg",
        blobName: "store1-main-blob",
        fileName: "store1-main.jpg",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        uuid: uuidv4(),
        store_id: 1,
        url: "https://example.com/images/store1-secondary.jpg",
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
