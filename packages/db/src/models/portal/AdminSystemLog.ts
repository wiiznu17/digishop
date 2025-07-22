import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface AdminSystemLogAttributes {
  id: number;
  adminId: number;
  action: string;
  targetEntity?: string | null;
  targetId?: number | null;
  timestamp?: Date;
}

export interface AdminSystemLogCreationAttributes
  extends Optional<AdminSystemLogAttributes, 'id' | 'targetEntity' | 'targetId' | 'timestamp'> {}

export class AdminSystemLog extends Model<AdminSystemLogAttributes, AdminSystemLogCreationAttributes>
  implements AdminSystemLogAttributes {
  public id!: number;
  public adminId!: number;
  public action!: string;
  public targetEntity!: string | null;
  public targetId!: number | null;
  public timestamp!: Date;

  static initModel(sequelize: Sequelize): typeof AdminSystemLog {
    AdminSystemLog.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        adminId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'admin_id',
        },
        action: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        targetEntity: {
          type: DataTypes.STRING(191),
          allowNull: true,
          field: 'target_entity',
        },
        targetId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'target_id',
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'ADMIN_SYSTEM_LOGS',
        modelName: 'AdminSystemLog',
        timestamps: false,
      }
    );
    return AdminSystemLog;
  }
}