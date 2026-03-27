import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { StoreStatus } from '../types/enum'

export interface StoreAttributes {
  id: number
  uuid: string
  userId: number
  storeName: string
  email: string
  phone?: string | null
  businessType: string
  website?: string | null
  logoUrl?: string | null // ไม่ได้ใช้
  description?: string | null
  status: StoreStatus
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface StoreCreationAttributes
  extends Optional<
    StoreAttributes,
    | 'id'
    | 'uuid'
    | 'phone'
    | 'website'
    | 'logoUrl'
    | 'description'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class Store
  extends Model<StoreAttributes, StoreCreationAttributes>
  implements StoreAttributes
{
  public id!: number
  public uuid!: string
  public userId!: number
  public storeName!: string
  public email!: string
  public phone!: string | null
  public businessType!: string
  public website!: string | null
  public logoUrl!: string | null
  public description!: string | null
  public status!: StoreStatus
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof Store {
    Store.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: DataTypes.UUIDV4
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          unique: true,
          field: 'user_id'
        },
        storeName: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: true,
          field: 'store_name'
        },
        email: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'email'
        },
        phone: {
          type: DataTypes.STRING(191),
          allowNull: true,
          field: 'phone'
        },
        businessType: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'business_type'
        },
        website: {
          type: DataTypes.STRING(191),
          allowNull: true,
          defaultValue: '-',
          field: 'website'
        },
        logoUrl: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'logo_url'
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        status: {
          type: DataTypes.ENUM(...Object.values(StoreStatus)),
          allowNull: false,
          defaultValue: StoreStatus.PENDING
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
        tableName: 'STORES',
        modelName: 'Store',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { name: 'uq_stores_uuid', fields: ['uuid'], unique: true },
          { name: 'uq_stores_user_id', fields: ['user_id'], unique: true },
          { name: 'ix_stores_status', fields: ['status'] },
          { name: 'ix_stores_created_at', fields: ['created_at'] },
          { name: 'uq_stores_store_name', fields: ['store_name'], unique: true }
        ]
      }
    )
    return Store
  }
}
