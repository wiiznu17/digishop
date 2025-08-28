// src/models/RefundStatusHistory.ts
import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { RefundStatus, ActorType } from "../types/enum";

export interface RefundStatusHistoryAttributes {
  id: number;
  refundOrderId: number;
  fromStatus?: RefundStatus | null;
  toStatus: RefundStatus;
  reason?: string | null;

  changedByType?: ActorType | null;
  changedById?: number | null;

  source?: string | null;           // WEB/API/etc
  correlationId?: string | null;
  metadata?: any | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefundStatusHistoryCreationAttributes
  extends Optional<
    RefundStatusHistoryAttributes,
    | "id"
    | "fromStatus"
    | "reason"
    | "changedByType"
    | "changedById"
    | "source"
    | "correlationId"
    | "metadata"
    | "createdAt"
    | "updatedAt"
  > {}

export class RefundStatusHistory
  extends Model<RefundStatusHistoryAttributes, RefundStatusHistoryCreationAttributes>
  implements RefundStatusHistoryAttributes
{
  public id!: number;
  public refundOrderId!: number;
  public fromStatus!: RefundStatus | null;
  public toStatus!: RefundStatus;
  public reason!: string | null;

  public changedByType!: ActorType | null;
  public changedById!: number | null;

  public source!: string | null;
  public correlationId!: string | null;
  public metadata!: any | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof RefundStatusHistory {
    RefundStatusHistory.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        refundOrderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "refund_order_id",
        },
        fromStatus: {
          type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"),
          allowNull: true,
          field: "from_status",
        },
        toStatus: {
          type: DataTypes.ENUM("REQUESTED", "APPROVED", "SUCCESS", "FAIL", "CANCELED"),
          allowNull: false,
          field: "to_status",
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "reason",
        },
        changedByType: {
          type: DataTypes.ENUM(...Object.values(ActorType)),
          allowNull: true,
          field: "changed_by_type",
        },
        changedById: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "changed_by_id",
        },
        source: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: "source",
        },
        correlationId: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: "correlation_id",
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          field: "metadata",
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
      },
      {
        sequelize,
        tableName: "REFUND_STATUS_HISTORY",
        modelName: "RefundStatusHistory",
        timestamps: true,
        underscored: true,
      }
    );
    return RefundStatusHistory;
  }
}
