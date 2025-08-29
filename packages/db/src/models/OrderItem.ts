import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;

  // 💰 เงินเป็นหน่วยย่อย (สตางค์)
  unitPriceMinor: number;      // ORDER_ITEMS.unit_price_minor
  discountMinor: number;       // ORDER_ITEMS.discount_minor
  taxRate: string;             // DECIMAL as string in Sequelize (e.g. "0.0700")

  // 🧊 snapshots
  productNameSnapshot: string; // ORDER_ITEMS.product_name_snapshot
  productSkuSnapshot: string;  // ORDER_ITEMS.product_sku_snapshot
  productSnapshot?: object | null; // ORDER_ITEMS.product_snapshot

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface OrderItemCreationAttributes
  extends Optional<
    OrderItemAttributes,
    | "id"
    | "discountMinor"
    | "taxRate"
    | "productSnapshot"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number;

  public unitPriceMinor!: number;
  public discountMinor!: number;
  public taxRate!: string;

  public productNameSnapshot!: string;
  public productSkuSnapshot!: string;
  public productSnapshot?: object | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof OrderItem {
    OrderItem.init(
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
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_id",
        },
        quantity: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },

        // amounts (minor)
        unitPriceMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "unit_price_minor",
        },
        discountMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "discount_minor",
        },
        taxRate: {
          // เก็บเป็น DECIMAL (เช่น 0.0700 = 7%)
          type: DataTypes.DECIMAL(5, 4),
          allowNull: false,
          defaultValue: "0.0000",
          field: "tax_rate",
        },

        // snapshots
        productNameSnapshot: {
          type: DataTypes.STRING(200),
          allowNull: false,
          field: "product_name_snapshot",
        },
        productSkuSnapshot: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: "product_sku_snapshot",
        },
        productSnapshot: {
          type: DataTypes.JSON,
          allowNull: true,
          field: "product_snapshot",
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
        tableName: "ORDER_ITEMS",
        modelName: "OrderItem",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { fields: ["order_id"] },
          { fields: ["product_id"] },
        ],
      }
    );
    return OrderItem;
  }
}
