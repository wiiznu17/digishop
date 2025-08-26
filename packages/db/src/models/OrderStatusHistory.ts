// models/OrderStatusHistory.ts
import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { OrderStatus } from '../types/enum';

export interface OrderStatusHistoryAttrs {
  id: number;
  orderId: number;
  fromStatus?: OrderStatus | null;
  toStatus: OrderStatus;
  changedByType: 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'SYSTEM';
  changedById?: number | null;
  reason?: string | null;
  source?: string | null;         // API | WEBHOOK | SCHEDULE | etc.
  correlationId?: string | null;  // requestId/eventId
  metadata?: object | null;       // JSON payload
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderStatusHistoryCreation
  extends Optional<OrderStatusHistoryAttrs, 'id' | 'fromStatus' | 'changedById' | 'reason' | 'source' | 'correlationId' | 'metadata' | 'createdAt' | 'updatedAt'> {}

export class OrderStatusHistory
  extends Model<OrderStatusHistoryAttrs, OrderStatusHistoryCreation>
  implements OrderStatusHistoryAttrs {
  public id!: number;
  public orderId!: number;
  public fromStatus!: OrderStatus | null;
  public toStatus!: OrderStatus;
  public changedByType!: 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'SYSTEM';
  public changedById!: number | null;
  public reason!: string | null;
  public source!: string | null;
  public correlationId!: string | null;
  public metadata!: object | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof OrderStatusHistory {
    OrderStatusHistory.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'order_id' },
        fromStatus: { type: DataTypes.ENUM(...Object.values(OrderStatus)), allowNull: true, field: 'from_status' },
        toStatus: { type: DataTypes.ENUM(...Object.values(OrderStatus)), allowNull: false, field: 'to_status' },
        changedByType: { type: DataTypes.ENUM('CUSTOMER','MERCHANT','ADMIN','SYSTEM'), allowNull: false, field: 'changed_by_type' },
        changedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'changed_by_id' },
        reason: { type: DataTypes.TEXT, allowNull: true },
        source: { type: DataTypes.STRING(50), allowNull: true },
        correlationId: { type: DataTypes.STRING(100), allowNull: true, field: 'correlation_id' },
        metadata: { type: DataTypes.JSON, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at', defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at', defaultValue: DataTypes.NOW },
      },
      {
        sequelize,
        tableName: 'ORDER_STATUS_HISTORY',
        modelName: 'OrderStatusHistory',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['order_id', 'created_at'] },
          { fields: ['to_status', 'created_at'] },
          { fields: ['changed_by_type', 'changed_by_id'] },
        ],
      }
    );
    return OrderStatusHistory;
  }
}
