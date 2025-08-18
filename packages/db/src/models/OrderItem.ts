import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string; // DECIMAL
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemCreationAttributes
  extends Optional<OrderItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number;
  public unitPrice!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

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
          field: 'order_id',
        },
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'product_id',
        },
        quantity: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        unitPrice: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: 'unit_price',
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
        tableName: 'ORDER_ITEMS',
        modelName: 'OrderItem',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return OrderItem;
  }
}