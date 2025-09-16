import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { OrderStatus } from "../types/enum";

export interface OrderAttributes {
  id: number;
  // orderCode: string;           // formatted as 'DSG20230915xxxxxx'
  checkoutId: number;
  storeId: number;
  reference: string;           // from Payment API

  // amounts in minor units
  // grandTotalMinor = subtotalMinor + shippingFeeMinor + taxTotalMinor - discountTotalMinor
  subtotalMinor: number;  // รวมราคาสินค้า (ไม่รวมค่าจัดส่ง, ภาษี, ส่วนลด)
  shippingFeeMinor: number; // ค่าจัดส่ง
  taxTotalMinor: number;  // รวมภาษีทั้งหมด
  discountTotalMinor: number; // รวมส่วนลดทั้งหมด
  grandTotalMinor: number;  // ยอดรวมสุทธิ (รวมทุกอย่างแล้ว)
  currencyCode: string;        // ISO 4217, e.g. 'THB', 'USD'

  status: OrderStatus;
  orderNote?: string | null;  // note from customer ตอนสร้าง order

  // snapshots เพื่อเก็บข้อมูล ณ ตอนสร้าง order
  customerNameSnapshot: string; // full name
  customerEmailSnapshot: string; // email
  storeNameSnapshot: string;  // ชื่อร้าน

  // idempotency/correlation (nullable)
  idempotencyKey?: string | null; // (optional) ส่งมาจากหน้าบ้าน ใช้กัน request ซ้ำ สมมติ order ที่มี idempotencyKey ยิง POST /orders ซ้ำ ระบบจะไม่สร้าง order ใหม่
  correlationId?: string | null;  // (optional) request correlation ID เผื่อใช้ในการ debug

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
  // public orderCode!: string;
  public checkoutId!: number;
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
        checkoutId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "checkout_id",
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
          { fields: ["checkout_id"] },
          { fields: ["store_id"] },
          { fields: ["status"] },
        ],
      }
    );
    return Order;
  }
}
