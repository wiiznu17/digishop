// @digishop/db/src/models/ProductItem.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import type { ProductConfiguration } from "./ProductConfiguration";

export interface ProductItemAttributes {
  id: number;
  uuid: string;
  productId: number;
  sku: string;                 // ⬅️ NOT NULL
  stockQuantity: number;
  isEnable: boolean;
  priceMinor: number;
  imageUrl?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductItemCreationAttributes
  extends Optional<
    ProductItemAttributes,
    "id" | "uuid" | "imageUrl" | "createdAt" | "updatedAt" | "deletedAt" | "isEnable"
  > {}

export class ProductItem
  extends Model<ProductItemAttributes, ProductItemCreationAttributes>
  implements ProductItemAttributes
{
  public id!: number;
  public uuid!: string;
  public productId!: number;
  public sku!: string;
  public stockQuantity!: number;
  public isEnable!: boolean;
  public priceMinor!: number;
  public imageUrl!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  declare configurations?: ProductConfiguration[];

  static initModel(sequelize: Sequelize): typeof ProductItem {
    ProductItem.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: DataTypes.UUIDV4,
        },
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_id",
        },
        sku: {
          type: DataTypes.STRING(191),       // utf8mb4 + index
          allowNull: false,
          validate: {
            notEmpty: { msg: "sku cannot be empty" },
            len: { args: [1, 191], msg: "sku length invalid" },
          },
          set(value: unknown) {
            if (typeof value === "string") {
              const v = value.trim();
              // @ts-ignore
              this.setDataValue("sku", v);
            } else if (value == null) {
              // @ts-ignore
              this.setDataValue("sku", "");
            }
          },
        },
        stockQuantity: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "stock_quantity",
        },
        isEnable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: "is_enable",
        },
        priceMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "price_minor",
        },
        imageUrl: {
          type: DataTypes.STRING(512),
          allowNull: true,
          field: "image_url",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "updated_at",
          defaultValue: DataTypes.NOW,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "deleted_at",
        },
      },
      {
        sequelize,
        tableName: "PRODUCT_ITEMS",
        modelName: "ProductItem",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { fields: ["uuid"], unique: true, name: "uq_product_items_uuid" },
          { fields: ["product_id"] },
          { unique: true, fields: ["product_id", "sku"], name: "uniq_items_product_sku" },
        ],
        hooks: {
          // Safety net: ถ้าใครลืม gen ที่ controller จะเติม AUTO ให้ก่อน validate
          beforeValidate: (item) => {
            if (!item.sku || !item.sku.trim()) {
              item.sku = `SKU-${item.productId}-AUTO-${Date.now().toString(36)}`;
            }
          },
        },
      }
    );
    return ProductItem;
  }
}
