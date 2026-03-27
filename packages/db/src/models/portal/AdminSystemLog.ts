import { Model, DataTypes, Optional, Sequelize } from 'sequelize'

export interface AdminSystemLogAttributes {
  id: number
  uuid?: string | null
  adminId: number
  action: string // e.g., UPDATE_PRODUCT, REFUND_APPROVE
  targetEntity: string // e.g., PRODUCT, ORDER, REFUND_ORDER, PAYMENT, STORE, USER
  targetId?: number | null // nullable
  correlationId?: string | null // nullable
  ip?: string | null // nullable
  userAgent?: string | null // nullable
  metadataJson?: object | null // nullable JSON
  timestamp: Date
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface AdminSystemLogCreationAttributes
  extends Optional<
    AdminSystemLogAttributes,
    | 'id'
    | 'uuid'
    | 'targetId'
    | 'correlationId'
    | 'ip'
    | 'userAgent'
    | 'metadataJson'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class AdminSystemLog
  extends Model<AdminSystemLogAttributes, AdminSystemLogCreationAttributes>
  implements AdminSystemLogAttributes
{
  public id!: number
  public uuid!: string | null
  public adminId!: number
  public action!: string
  public targetEntity!: string
  public targetId!: number | null
  public correlationId!: string | null
  public ip!: string | null
  public userAgent!: string | null
  public metadataJson!: object | null
  public timestamp!: Date
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof AdminSystemLog {
    AdminSystemLog.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: {
          type: DataTypes.STRING(36),
          allowNull: true
        },
        adminId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'admin_id'
        },
        action: {
          type: DataTypes.STRING(128),
          allowNull: false
        },
        targetEntity: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: 'target_entity'
        },
        targetId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'target_id'
        },
        correlationId: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: 'correlation_id'
        },
        ip: {
          type: DataTypes.STRING(64),
          allowNull: true
        },
        userAgent: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'user_agent'
        },
        metadataJson: {
          type: DataTypes.JSON,
          allowNull: true,
          field: 'metadata_json'
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
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
        tableName: 'ADMIN_SYSTEM_LOGS',
        modelName: 'AdminSystemLog',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['admin_id'] },
          { fields: ['timestamp'] },
          { fields: ['target_entity', 'target_id'] },
          { fields: ['correlation_id'] }
        ]
      }
    )
    return AdminSystemLog
  }
}
