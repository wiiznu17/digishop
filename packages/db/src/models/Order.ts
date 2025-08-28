import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { OrderStatus } from '../types/enum';

export interface OrderAttributes {
  id: number;
  orderCode: string;
  customerId: number;
  storeId: number;
  reference: string;
  orderNote?: string;
  totalPrice: string; // DECIMAL
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes
  extends Optional<OrderAttributes, 'id' | 'reference' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public orderCode!: string
  public customerId!: number;
  public storeId!: number;
  public reference!: string;
  public orderNote?: string;
  public totalPrice!: string;
  public status!: OrderStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Order {
    Order.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        orderCode: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'order_code'
        },
        customerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'customer_id',
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'store_id',
        },
        reference: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'reference',
        },
        orderNote: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'order_note',
        },
        totalPrice: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: 'total_price',
        },
        status: {
          type: DataTypes.ENUM(...Object.values(OrderStatus)),
          allowNull: false,
          defaultValue: OrderStatus.PENDING,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'ORDERS',
        modelName: 'Order',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return Order;
  }
}