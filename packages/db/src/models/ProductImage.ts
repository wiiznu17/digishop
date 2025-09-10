// src/models/ProductImage.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ProductImageAttributes {
  id: number;
  uuid: string;
  productId: number;
  url: string;
  blobName: string;
  fileName: string;
  isMain: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductImageCreationAttributes
  extends Optional<ProductImageAttributes, "id" | "uuid" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class ProductImage
  extends Model<ProductImageAttributes, ProductImageCreationAttributes>
  implements ProductImageAttributes
{
  public id!: number;
  public uuid!: string;
  public productId!: number;
  public url!: string;
  public blobName!: string;
  public fileName!: string;
  public isMain!: boolean;
  public sortOrder!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof ProductImage {
    ProductImage.init(
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
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_id",
          references: {
            model: "PRODUCTS",
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
        isMain: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "is_main",
        },
        sortOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: "sort_order",
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
          { name: "uq_product_images_uuid", fields: ["uuid"], unique: true },
          { name: "ix_product_images_product_sort", fields: ["product_id", "sort_order"] },
          { name: "ix_product_images_product_main", fields: ["product_id", "is_main"] },
        ],
      }
    );
    return ProductImage;
  }
}
