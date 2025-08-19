import { QueryInterface } from "sequelize";

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert("profile_images", [
      {
        id: "11111111-1111-1111-1111-111111111111",
        store_id: 1,
        url: "https://example.com/images/store1-main.jpg",
        blobName: "store1-main-blob",
        fileName: "store1-main.jpg",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
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
