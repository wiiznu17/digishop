import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { PaymentStatus, PaymentType } from "../types/enum";

export interface PaymentAttributes {
  id: number;
  checkoutId: number;

  // UI/redirect (optional)
  urlRedirect?: string | null;

  // business fields
  paymentMethod: string;        // CREDIT_CARD / PROMPTPAY / QR / COD etc.
  status: PaymentStatus;        // PENDING / SUCCESS / FAILED
  paidAt?: Date | null;

  // gateway snapshot fields
  provider: string;             // PGW provider --> "DigiPay"
  providerRef?: string | null;  // refference from PGW
  channel: string;              // e.g. "CARD", "BANK_TRANSFER", "WALLET"
  currencyCode: string;         // ISO 4217, e.g. 'THB', 'USD'

  amountAuthorizedMinor: number; // amount verified by PGW when response url redirect
  amountCapturedMinor: number; // amount หลังจาก Approved ที่ PGW
  amountRefundedMinor: number; // amount ที่ refund

  pgwStatus?: string | null;    // สถานะฝั่ง PGW เช่น Approved/Pre settled/Settled
  pgwPayload: object;           // เก็บ raw payload ล่าสุดจาก PGW(response) --> payment, notify API

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface PaymentCreationAttributes
  extends Optional<
    PaymentAttributes,
    | "id"
    | "urlRedirect"
    | "status"
    | "paidAt"
    | "providerRef"
    | "pgwStatus"
    | "pgwPayload"
    | "amountAuthorizedMinor"
    | "amountCapturedMinor"
    | "amountRefundedMinor"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: number;
  public checkoutId!: number;

  public urlRedirect!: string | null;

  public paymentMethod!: string;
  public status!: PaymentStatus;
  public timestamp!: Date;
  public approvalCode!: string;
  public bankReference!: string;
  public paidAt!: Date | null;

  public provider!: string;
  public providerRef!: string | null; // reference from PGW
  public channel!: string;
  public currencyCode!: string;

  public amountAuthorizedMinor!: number;
  public amountCapturedMinor!: number;
  public amountRefundedMinor!: number;

  public pgwStatus!: string | null;
  public pgwPayload!: object;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof Payment {
    Payment.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        checkoutId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "checkout_id",
        },
        urlRedirect: {
          type: DataTypes.STRING(2048),
          allowNull: true,
          field: "url_redirect",
        },

        paymentMethod: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: "payment_method",
        },
        status: {
          // type: DataTypes.ENUM(...Object.values(PaymentStatus)),
          type: DataTypes.STRING(255),
          allowNull: false,
          defaultValue: PaymentStatus.PENDING,
        },
        paidAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "paid_at",
        },

        // gateway snapshot fields
        provider: {
          type: DataTypes.STRING(64),
          allowNull: false,
          defaultValue: "DGS_PGW",
        },
        providerRef: {
          type: DataTypes.STRING(128),
          allowNull: true,
          field: "provider_ref",
        },
        channel: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: "CARD",
        },
        currencyCode: {
          type: DataTypes.STRING(3),
          allowNull: false,
          defaultValue: "THB",
          field: "currency_code",
        },

        amountAuthorizedMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "amount_authorized_minor",
        },
        amountCapturedMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "amount_captured_minor",
        },
        amountRefundedMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "amount_refunded_minor",
        },

        pgwStatus: {
          type: DataTypes.STRING(32),
          allowNull: true,
          field: "pgw_status",
        },
        pgwPayload: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {},
          field: "pgw_payload",
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
        tableName: "PAYMENTS",
        modelName: "Payment",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { fields: ["status"] },
          { fields: ["provider_ref"] },
          { fields: ["created_at"] },
        ],
      }
    );
    return Payment;
  }
}
