import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { OrderStatus } from "../types/enum";

export interface OrderAttributes {
  id: number;
  orderCode: string;           // ORDERS.order_code
  customerId: number;          // ORDERS.customer_id
  storeId: number;             // ORDERS.store_id
  reference: string;           // ORDERS.reference

  // 💰 amounts in minor units (e.g. satang)
  subtotalMinor: number;       // ORDERS.subtotal_minor
  shippingFeeMinor: number;    // ORDERS.shipping_fee_minor
  taxTotalMinor: number;       // ORDERS.tax_total_minor
  discountTotalMinor: number;  // ORDERS.discount_total_minor
  grandTotalMinor: number;     // ORDERS.grand_total_minor
  currencyCode: string;        // ORDERS.currency_code (e.g. 'THB')

  status: OrderStatus;         // ORDERS.status
  orderNote?: string | null;   // ORDERS.order_note

  // 🧊 snapshots
  customerNameSnapshot: string;   // ORDERS.customer_name_snapshot
  customerEmailSnapshot: string;  // ORDERS.customer_email_snapshot
  storeNameSnapshot: string;      // ORDERS.store_name_snapshot

  // idempotency/correlation (nullable)
  idempotencyKey?: string | null; // ORDERS.idempotency_key
  correlationId?: string | null;  // ORDERS.correlation_id

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface OrderCreationAttributes
  extends Optional<
    OrderAttributes,
    | "id"
    | "orderNote"
    | "idempotencyKey"
    | "correlationId"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: number;
  public orderCode!: string;
  public customerId!: number;
  public storeId!: number;
  public reference!: string;

  public subtotalMinor!: number;
  public shippingFeeMinor!: number;
  public taxTotalMinor!: number;
  public discountTotalMinor!: number;
  public grandTotalMinor!: number;
  public currencyCode!: string;

  public status!: OrderStatus;
  public orderNote?: string | null;

  public customerNameSnapshot!: string;
  public customerEmailSnapshot!: string;
  public storeNameSnapshot!: string;

  public idempotencyKey?: string | null;
  public correlationId?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof Order {
    Order.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        orderCode: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: "order_code",
        },
        customerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "customer_id",
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "store_id",
        },
        reference: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: "reference",
        },

        // amounts (minor)
        subtotalMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "subtotal_minor",
          defaultValue: 0,
        },
        shippingFeeMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "shipping_fee_minor",
          defaultValue: 0,
        },
        taxTotalMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "tax_total_minor",
          defaultValue: 0,
        },
        discountTotalMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "discount_total_minor",
          defaultValue: 0,
        },
        grandTotalMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "grand_total_minor",
          defaultValue: 0,
        },
        currencyCode: {
          type: DataTypes.STRING(3),
          allowNull: false,
          field: "currency_code",
          defaultValue: "THB",
        },

        status: {
          type: DataTypes.ENUM(...Object.values(OrderStatus)),
          allowNull: false,
          defaultValue: OrderStatus.PENDING,
          field: "status",
        },
        orderNote: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: "order_note",
        },

        // snapshots
        customerNameSnapshot: {
          type: DataTypes.STRING(200),
          allowNull: false,
          field: "customer_name_snapshot",
        },
        customerEmailSnapshot: {
          type: DataTypes.STRING(254),
          allowNull: false,
          field: "customer_email_snapshot",
        },
        storeNameSnapshot: {
          type: DataTypes.STRING(200),
          allowNull: false,
          field: "store_name_snapshot",
        },

        idempotencyKey: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: "idempotency_key",
        },
        correlationId: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: "correlation_id",
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
        tableName: "ORDERS",
        modelName: "Order",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { fields: ["customer_id"] },
          { fields: ["store_id"] },
          { fields: ["status"] },
          { unique: true, fields: ["order_code"] },
          { unique: true, fields: ["reference"] },
        ],
      }
    );
    return Order;
  }
}
