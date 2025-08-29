import { QueryInterface, DataTypes, Sequelize } from "sequelize";
import { ShippingStatus } from "../types/enum";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      "SHIPPING_INFO",
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },

        order_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "ORDERS", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },

        tracking_number: {
          type: DataTypes.STRING(100),
          allowNull: true,
          // ถ้าต้องการ unique ให้เปิดบรรทัดถัดไป (และแก้ seeder ไม่ให้ชน)
          // unique: true,
        },

        carrier: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },

        shipping_type_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "SHIPPING_TYPES", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },

        shipping_address: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "ADDRESSES", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },

        shipping_status: {
          type: DataTypes.ENUM(...Object.values(ShippingStatus)),
          allowNull: false,
          defaultValue: ShippingStatus.PENDING,
        },

        shipped_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },

        // ⬇️ Snapshot fields
        shipping_type_name_snapshot: {
          type: DataTypes.STRING(80),
          allowNull: false,
          defaultValue: "",
        },
        shipping_price_minor_snapshot: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        address_snapshot: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {},
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
          ),
        },

        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        engine: "InnoDB",
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
      }
    );

    await queryInterface.addIndex("SHIPPING_INFO", ["order_id"]);
    await queryInterface.addIndex("SHIPPING_INFO", ["shipping_type_id"]);
    await queryInterface.addIndex("SHIPPING_INFO", ["shipping_address"]);
    await queryInterface.addIndex("SHIPPING_INFO", ["shipping_status"]);
    await queryInterface.addIndex("SHIPPING_INFO", ["tracking_number"]);
    await queryInterface.addIndex("SHIPPING_INFO", ["created_at"]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("SHIPPING_INFO");
  },
};
