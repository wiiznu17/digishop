import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ProductViewAttributes {
  id: number;
  productId: number;
  userId?: number | null; // nullable for guest
  sessionId?: string | null; // frontend generated session ID and set in cookie for guest or logged-in user. and then send to backend
  viewedAt?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductViewCreationAttributes
  extends Optional<ProductViewAttributes, 'id' | 'userId' | 'sessionId' | 'viewedAt' | 'ipAddress' | 'userAgent' | 'createdAt' | 'updatedAt'> {}

export class ProductView extends Model<ProductViewAttributes, ProductViewCreationAttributes> implements ProductViewAttributes {
  public id!: number;
  public productId!: number;
  public userId!: number | null;
  public sessionId!: string | null;
  public viewedAt!: Date;
  public ipAddress!: string | null;
  public userAgent!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof ProductView {
    ProductView.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'product_id',
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
        tableName: 'PRODUCT_VIEWS',
        modelName: 'ProductView',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return ProductView;
  }
}