import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { StoreStatus } from '../types/enum';

export interface StoreAttributes {
  id: number;
  userId: number;
  storeName: string;
  email: string;
  phone: string;
  businessType: string;
  logoUrl?: string | null;
  description?: string | null;
  status: StoreStatus;
  createdAt?: Date;
  updatedAt?: Date; // auto
}

export interface StoreCreationAttributes
  extends Optional<StoreAttributes, 'id' | 'logoUrl' | 'description' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
  public id!: number;
  public userId!: number;
  public storeName!: string;
  public email!: string;
  public phone!: string;
  public businessType!: string;
  public logoUrl!: string | null;
  public description!: string | null;
  public status!: StoreStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Store {
    Store.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          unique: true,
          field: 'user_id',
        },
        storeName: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'store_name',
        },
        email: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'email',
        },
        phone: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'phone',
        },
          businessType: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'business_type',
        },
        logoUrl: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'logo_url',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(StoreStatus)),
          allowNull: false,
          defaultValue: StoreStatus.PENDING,
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
        tableName: 'STORES',
        modelName: 'Store',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return Store;
  }
}