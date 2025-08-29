// src/models/RefundImage.ts
import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface RefundImageAttributes {
  id: number;                // INT PK (ตาม ER)
  refundOrderId: number;     // FK -> REFUND_ORDERS.id
  url: string;
  blobName: string;
  fileName: string;
  isMain: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface RefundImageCreationAttributes
  extends Optional<RefundImageAttributes, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class RefundImage
  extends Model<RefundImageAttributes, RefundImageCreationAttributes>
  implements RefundImageAttributes
{
  public id!: number;
  public refundOrderId!: number;
  public url!: string;
  public blobName!: string;
  public fileName!: string;
  public isMain!: boolean;
  public order!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof RefundImage {
    RefundImage.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        refundOrderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "refund_order_id",
          references: { model: "REFUND_ORDERS", key: "id" },
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
        order: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "order",
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
        tableName: "REFUND_IMAGES",
        modelName: "RefundImage",
        timestamps: true,
        underscored: true,
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { name: "idx_refund_images_refund_order_id", fields: ["refund_order_id"] },
          { name: "idx_refund_images_refund_order_sort", fields: ["refund_order_id", "sort_order"] },
        ],
      }
    );
    return RefundImage;
  }
}
