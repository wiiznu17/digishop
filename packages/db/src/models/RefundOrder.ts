// src/models/RefundOrder.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { RefundStatus } from "../types/enum";

export interface RefundOrderAttributes {
  id: number;
  orderId: number;
  paymentId?: number | null;

  // amounts & currency (snapshot spec)
  amountMinor: number;              // int (minor units, e.g. satang)
  currencyCode: string;             // e.g. 'THB'

  // business fields
  reason?: string | null;
  merchantRejectReason?: string | null;
  status: RefundStatus;
  refundChannel?: string | null;    // e.g. 'CARD','PROMPTPAY'
  refundRef?: string | null;        // provider refund reference

  description?: string | null;
  contactEmail?: string | null;

  requestedBy?: "CUSTOMER" | "MERCHANT" | null;
  requestedAt?: Date | null;
  approvedAt?: Date | null;
  refundedAt?: Date | null;

  pgwPayload?: any | null;          // raw payload from PGW (optional)
  metadata?: any | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface RefundOrderCreationAttributes
  extends Optional<
    RefundOrderAttributes,
    | "id"
    | "paymentId"
    | "reason"
    | "merchantRejectReason"
    | "refundChannel"
    | "refundRef"
    | "description"
    | "contactEmail"
    | "requestedBy"
    | "requestedAt"
    | "approvedAt"
    | "refundedAt"
    | "pgwPayload"
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
  public paymentId!: number | null;

  public amountMinor!: number;
  public currencyCode!: string;

  public reason!: string | null;
  public merchantRejectReason!: string | null;
  public status!: RefundStatus;
  public refundChannel!: string | null;
  public refundRef!: string | null;

  public description!: string | null;
  public contactEmail!: string | null;

  public requestedBy!: "CUSTOMER" | "MERCHANT" | null;
  public requestedAt!: Date | null;
  public approvedAt!: Date | null;
  public refundedAt!: Date | null;

  public pgwPayload!: any | null;
  public metadata!: any | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof RefundOrder {
    RefundOrder.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "order_id",
        },
        paymentId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "payment_id",
        },

        // money & currency (minor unit)
        amountMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "amount_minor",
          comment: "Minor units (e.g. 4100.00 THB -> 410000)",
        },
        currencyCode: {
          type: DataTypes.STRING(3),
          allowNull: false,
          field: "currency_code",
          defaultValue: "THB",
        },

        reason: { type: DataTypes.TEXT, allowNull: true, field: "reason" },
        merchantRejectReason: { type: DataTypes.TEXT, allowNull: true, field: "merchant_reject_reason" },

        status: {
          type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"),
          allowNull: false,
          defaultValue: "REQUESTED",
        },

        refundChannel: { type: DataTypes.STRING(50), allowNull: true, field: "refund_channel" },
        refundRef: { type: DataTypes.STRING(100), allowNull: true, field: "refund_ref" },

        description: { type: DataTypes.TEXT, allowNull: true, field: "description" },
        contactEmail: { type: DataTypes.STRING(255), allowNull: true, field: "contact_email" },

        requestedBy: { type: DataTypes.ENUM("CUSTOMER", "MERCHANT"), allowNull: true, field: "requested_by" },
        requestedAt: { type: DataTypes.DATE, allowNull: true, field: "requested_at" },
        approvedAt: { type: DataTypes.DATE, allowNull: true, field: "approved_at" },
        refundedAt: { type: DataTypes.DATE, allowNull: true, field: "refunded_at" },

        pgwPayload: { type: DataTypes.JSON, allowNull: true, field: "pgw_payload" },
        metadata: { type: DataTypes.JSON, allowNull: true, field: "metadata" },

        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "REFUND_ORDERS",
        modelName: "RefundOrder",
        paranoid: true,
        deletedAt: "deleted_at",
        underscored: true,
        indexes: [
          { fields: ["order_id"] },
          { fields: ["payment_id"] },
          { fields: ["status"] },
          { fields: ["created_at"] },
        ],
      }
    );
    return RefundOrder;
  }
}
