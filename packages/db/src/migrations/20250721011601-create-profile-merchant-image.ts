import { DataTypes } from "sequelize";
import { QueryInterface } from "sequelize";

export = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("profile_images", {
      id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
      },
      uuid: {
          // เก็บเป็น CHAR(36); default uuid v4 ให้ที่ Model/Seeder (MySQL ไม่มี uuidv4() ใน DB)
          type: DataTypes.STRING(36),
          allowNull: false,
          unique: true,
        },
      store_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "STORES",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      blobName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("profile_images");
  },
};
