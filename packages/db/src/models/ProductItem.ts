import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ProductItemAttributes {
  id: number;
  productId: number;
  sku: string;
  stockQuantity: number;
  priceMinor: number;
  imageUrl?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductItemCreationAttributes
  extends Optional<
    ProductItemAttributes,
    "id" | "imageUrl" | "createdAt" | "updatedAt" | "deletedAt"
  > {}

export class ProductItem
  extends Model<ProductItemAttributes, ProductItemCreationAttributes>
  implements ProductItemAttributes
{
  public id!: number;
  public productId!: number;
  public sku!: string;
  public stockQuantity!: number;
  public priceMinor!: number;
  public imageUrl?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof ProductItem {
    ProductItem.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_id",
        },
        sku: {
          type: DataTypes.STRING(64),
          allowNull: false,
          unique: true,
        },
        stockQuantity: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "stock_quantity",
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
          { unique: true, fields: ["sku"] },
          { fields: ["product_id"] },
        ],
      }
    );
    return ProductItem;
  }
}
