import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface StoreViewAttributes {
  id: number;
  storeId: number;
  userId?: number | null;
  sessionId?: string | null;
  viewedAt?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StoreViewCreationAttributes
  extends Optional<StoreViewAttributes, 'id' | 'userId' | 'sessionId' | 'viewedAt' | 'ipAddress' | 'userAgent' | 'createdAt' | 'updatedAt'> {}

export class StoreView extends Model<StoreViewAttributes, StoreViewCreationAttributes> implements StoreViewAttributes {
  public id!: number;
  public storeId!: number;
  public userId!: number | null;
  public sessionId!: string | null;
  public viewedAt!: Date;
  public ipAddress!: string | null;
  public userAgent!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof StoreView {
    StoreView.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'store_id',
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'user_id',
        },
        sessionId: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'session_id',
        },
        viewedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'viewed_at',
          defaultValue: DataTypes.NOW,
        },
        ipAddress: {
          type: DataTypes.STRING(45),
          allowNull: true,
          field: 'ip_address',
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'user_agent',
        },
      },
      {
        sequelize,
        tableName: 'STORE_VIEWS',
        modelName: 'StoreView',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return StoreView;
  }
}