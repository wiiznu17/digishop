// src/models/PaymentGatewayEvent.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface PaymentGatewayEventAttributes {
  id: number;
  orderId: number;
  paymentId: number;
  refundOrderId?: number | null;

  type: string;            // เก็บว่า event นี้คืออะไร เช่น "REFUND", "VOID"
  amountMinor: number;     // amount in minor units (e.g. THB*100)
  provider: string;        // PGW name, e.g. "DigiPay", "PromptPayGateway"
  providerRef?: string | null; // reference from PGW, e.g. transactionId
  status: string;          // SUCCESS | FAILED | PENDING
  requestId?: string | null;    // สร้างขึ้นเองเพื่อ track request/response กับ PGW

  reqJson?: any | null;    // raw request body
  resJson?: any | null;    // raw response body

  createdAt?: Date;
}

export interface PaymentGatewayEventCreationAttributes
  extends Optional<
    PaymentGatewayEventAttributes,
    "id" | "refundOrderId" | "providerRef" | "requestId" | "reqJson" | "resJson" | "createdAt"
  > {}

export class PaymentGatewayEvent
  extends Model<PaymentGatewayEventAttributes, PaymentGatewayEventCreationAttributes>
  implements PaymentGatewayEventAttributes
{
  public id!: number;
  public orderId!: number;
  public paymentId!: number;
  public refundOrderId!: number | null;

  public type!: string;
  public amountMinor!: number;
  public provider!: string;
  public providerRef!: string | null;
  public status!: string;
  public requestId!: string | null;

  public reqJson!: any | null;
  public resJson!: any | null;

  public readonly createdAt!: Date;

  static initModel(sequelize: Sequelize): typeof PaymentGatewayEvent {
    PaymentGatewayEvent.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "order_id" },
        paymentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "payment_id" },
        refundOrderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: "refund_order_id" },

        type: { type: DataTypes.STRING(50), allowNull: false },
        amountMinor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "amount_minor" },
        provider: { type: DataTypes.STRING(50), allowNull: false },
        providerRef: { type: DataTypes.STRING(100), allowNull: true, field: "provider_ref" },
        status: { type: DataTypes.STRING(20), allowNull: false },
        requestId: { type: DataTypes.STRING(100), allowNull: true, field: "request_id" },

        reqJson: { type: DataTypes.JSON, allowNull: true, field: "req_json" },
        resJson: { type: DataTypes.JSON, allowNull: true, field: "res_json" },

        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: "PAYMENT_GATEWAY_EVENTS",
        modelName: "PaymentGatewayEvent",
        timestamps: false,     // append-only (no updated_at / deleted_at)
        underscored: true,
        indexes: [
          { name: "idx_pge_order_id", fields: ["order_id"] },
          { name: "idx_pge_payment_id", fields: ["payment_id"] },
          { name: "idx_pge_refund_order_id", fields: ["refund_order_id"] },
          { name: "idx_pge_provider_ref", fields: ["provider_ref"] },
          { name: "idx_pge_request_id", fields: ["request_id"] },
          { name: "idx_pge_created_at", fields: ["created_at"] },
          { name: "idx_pge_payment_created", fields: ["payment_id", "created_at"] },
        ],
      }
    );
    return PaymentGatewayEvent;
  }
}
