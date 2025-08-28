// src/models/RefundOrder.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { RefundStatus } from "../types/enum";

export interface RefundOrderAttributes {
  id: number;
  orderId: number;
  reason?: string | null;                 // เหตุผลจากฝั่งลูกค้า (เดิม)
  merchantRejectReason?: string | null;   // เหตุผลจากฝั่งร้านค้า (กรณีปฏิเสธ)
  amount?: string | null;                 // DECIMAL -> string ใน TS
  status: RefundStatus;

  description?: string | null;            // รายละเอียดเพิ่มเติม
  contactEmail?: string | null;           // อีเมลสำหรับติดต่อ

  requestedBy?: "CUSTOMER" | "MERCHANT" | null;
  requestedAt?: Date | null;
  approvedAt?: Date | null;
  refundedAt?: Date | null;
  metadata?: any | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface RefundOrderCreationAttributes
  extends Optional<
    RefundOrderAttributes,
    | "id"
    | "reason"
    | "merchantRejectReason"
    | "amount"
    | "status"
    | "description"
    | "contactEmail"
    | "requestedBy"
    | "requestedAt"
    | "approvedAt"
    | "refundedAt"
    | "metadata"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class RefundOrder
  extends Model<RefundOrderAttributes, RefundOrderCreationAttributes>
  implements RefundOrderAttributes
{
  public id!: number;
  public orderId!: number;
  public reason!: string | null;
  public merchantRejectReason!: string | null;
  public amount!: string | null;
  public status!: RefundStatus;

  public description!: string | null;
  public contactEmail!: string | null;

  public requestedBy!: "CUSTOMER" | "MERCHANT" | null;
  public requestedAt!: Date | null;
  public approvedAt!: Date | null;
  public refundedAt!: Date | null;
  public metadata!: any | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof RefundOrder {
    RefundOrder.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "order_id",
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "reason",
        },
        merchantRejectReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "merchant_reject_reason",
        },
        amount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
          field: "amount",
        },
        status: {
          type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"),
          allowNull: false,
          defaultValue: "REQUESTED",
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "description",
        },
        contactEmail: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: "contact_email",
        },
        requestedBy: {
          type: DataTypes.ENUM("CUSTOMER", "MERCHANT"),
          allowNull: true,
          field: "requested_by",
        },
        requestedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "requested_at",
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "approved_at",
        },
        refundedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "refunded_at",
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          field: "metadata",
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
        tableName: "REFUND_ORDERS",
        modelName: "RefundOrder",
        paranoid: true,
        deletedAt: "deleted_at",
        underscored: true,
      }
    );
    return RefundOrder;
  }
}
