// src/models/RefundStatusHistory.ts
import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { RefundStatus, ActorType } from '../types/enum'

export interface RefundStatusHistoryAttributes {
  id: number
  refundOrderId: number
  fromStatus?: RefundStatus | null
  toStatus: RefundStatus
  reason?: string | null
  changedByType?: ActorType | null
  changedById?: number | null
  source?: string | null // API | WEB | WEBHOOK | SYSTEM | SCHEDULE
  correlationId?: string | null // requestId / eventId สำหรับ trace
  metadata?: any | null // JSON payload
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface RefundStatusHistoryCreationAttributes
  extends Optional<
    RefundStatusHistoryAttributes,
    | 'id'
    | 'fromStatus'
    | 'reason'
    | 'changedByType'
    | 'changedById'
    | 'source'
    | 'correlationId'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class RefundStatusHistory
  extends Model<
    RefundStatusHistoryAttributes,
    RefundStatusHistoryCreationAttributes
  >
  implements RefundStatusHistoryAttributes
{
  public id!: number
  public refundOrderId!: number
  public fromStatus!: RefundStatus | null
  public toStatus!: RefundStatus
  public reason!: string | null
  public changedByType!: ActorType | null
  public changedById!: number | null
  public source!: string | null
  public correlationId!: string | null
  public metadata!: any | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof RefundStatusHistory {
    RefundStatusHistory.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        refundOrderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'refund_order_id'
        },
        fromStatus: {
          type: DataTypes.ENUM(...Object.values(RefundStatus)),
          allowNull: true,
          field: 'from_status'
        },
        toStatus: {
          type: DataTypes.ENUM(...Object.values(RefundStatus)),
          allowNull: false,
          field: 'to_status'
        },
        reason: { type: DataTypes.TEXT, allowNull: true, field: 'reason' },
        changedByType: {
          type: DataTypes.ENUM(...Object.values(ActorType)),
          allowNull: true,
          field: 'changed_by_type'
        },
        changedById: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'changed_by_id'
        },
        source: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'source'
        },
        correlationId: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'correlation_id'
        },
        metadata: { type: DataTypes.JSON, allowNull: true, field: 'metadata' },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: DataTypes.NOW
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at'
        }
      },
      {
        sequelize,
        tableName: 'REFUND_STATUS_HISTORY',
        modelName: 'RefundStatusHistory',
        underscored: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          {
            name: 'idx_rsh_refund_order_created',
            fields: ['refund_order_id', 'created_at']
          },
          {
            name: 'idx_rsh_to_status_created',
            fields: ['to_status', 'created_at']
          },
          {
            name: 'idx_rsh_changed_by',
            fields: ['changed_by_type', 'changed_by_id']
          }
        ]
      }
    )
    return RefundStatusHistory
  }
}
