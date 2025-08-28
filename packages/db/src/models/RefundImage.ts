// src/models/RefundImage.ts
import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface RefundImageAttributes {
  id: string;             // UUID
  refundOrderId: number;  // FK -> REFUND_ORDERS.id (int)
  url: string;
  blobName: string;
  fileName: string;
  isMain: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefundImageCreationAttributes
  extends Optional<RefundImageAttributes, "id" | "createdAt" | "updatedAt"> {}

export class RefundImage
  extends Model<RefundImageAttributes, RefundImageCreationAttributes>
  implements RefundImageAttributes
{
  public id!: string;
  public refundOrderId!: number;
  public url!: string;
  public blobName!: string;
  public fileName!: string;
  public isMain!: boolean;
  public order!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof RefundImage {
    RefundImage.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
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
          type: DataTypes.STRING,
          allowNull: false,
          field: "blob_name",
        },
        fileName: {
          type: DataTypes.STRING,
          allowNull: false,
          field: "file_name",
        },
        isMain: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          field: "is_main",
        },
        order: {
          type: DataTypes.INTEGER,
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
      },
      {
        sequelize,
        tableName: "REFUND_IMAGES",
        timestamps: true,
        underscored: true,
      }
    );
    return RefundImage;
  }
}
