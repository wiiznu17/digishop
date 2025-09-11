// src/models/ProductItemImage.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ProductItemImageAttributes {
  id: number;
  uuid: string;
  productItemId: number;
  url: string;
  blobName: string;
  fileName: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductItemImageCreationAttributes
  extends Optional<ProductItemImageAttributes, "id" | "uuid" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class ProductItemImage
  extends Model<ProductItemImageAttributes, ProductItemImageCreationAttributes>
  implements ProductItemImageAttributes
{
  public id!: number;
  public uuid!: string;
  public productItemId!: number;
  public url!: string;
  public blobName!: string;
  public fileName!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof ProductItemImage {
    ProductItemImage.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        uuid: {
          // CHAR(36) for UUID v4
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: DataTypes.UUIDV4,
        },
        productItemId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_item_id",
          unique: true,
          references: {
            model: "PRODUCT_ITEMS",
            key: "id",
          },
        },
        url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        blobName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: "blob_name",
        },
        fileName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: "file_name",
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
        tableName: "PRODUCT_IMAGES",
        modelName: "ProductImage",
        underscored: true,
        timestamps: true,
        paranoid: true, // uses deleted_at
        deletedAt: "deleted_at",
        defaultScope: {
          order: [
            ["sortOrder", "ASC"],
            ["createdAt", "ASC"],
          ],
        },
        indexes: [
          { name: "uq_product_item_images_uuid", fields: ["uuid"], unique: true },
        ],
      }
    );
    return ProductItemImage;
  }
}
