import { QueryInterface } from "sequelize"

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert("PRODUCT_IMAGES", [
      // Smartphone X (1001)
      {
        id: "img-1001-main",
        productId: 1001,
        url: "https://example.com/images/smartphone-x-main.jpg",
        blobName: "smartphone-x-main.jpg",
        fileName: "smartphone-x-main.jpg",
        isMain: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "img-1001-side",
        productId: 1001,
        url: "https://example.com/images/smartphone-x-side.jpg",
        blobName: "smartphone-x-side.jpg",
        fileName: "smartphone-x-side.jpg",
        isMain: false,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Smartphone Y (1002)
      {
        id: "img-1002-main",
        productId: 1002,
        url: "https://example.com/images/smartphone-y-main.jpg",
        blobName: "smartphone-y-main.jpg",
        fileName: "smartphone-y-main.jpg",
        isMain: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Laptop Pro 15 (1003)
      {
        id: "img-1003-main",
        productId: 1003,
        url: "https://example.com/images/laptop-pro15-main.jpg",
        blobName: "laptop-pro15-main.jpg",
        fileName: "laptop-pro15-main.jpg",
        isMain: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Wireless Earbuds (1004)
      {
        id: "img-1004-main",
        productId: 1004,
        url: "https://example.com/images/earbuds-main.jpg",
        blobName: "earbuds-main.jpg",
        fileName: "earbuds-main.jpg",
        isMain: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Smartwatch Z (1005)
      {
        id: "img-1005-main",
        productId: 1005,
        url: "https://example.com/images/smartwatch-z-main.jpg",
        blobName: "smartwatch-z-main.jpg",
        fileName: "smartwatch-z-main.jpg",
        isMain: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete("PRODUCT_IMAGES", {
      id: [
        "img-1001-main",
        "img-1001-side",
        "img-1002-main",
        "img-1003-main",
        "img-1004-main",
        "img-1005-main",
      ],
    })
  },
}
