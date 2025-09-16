import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../db'

export interface ProfileMerchantImageAttributes {
  id: string
  uuid: string
  storeId: number
  url: string
  blobName: string
  fileName: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ProfileMerchantImageCreationAttributes
  extends Optional<ProfileMerchantImageAttributes, 'id' | "uuid" | 'createdAt' | 'updatedAt'> {}

export class ProfileMerchantImage
  extends Model<ProfileMerchantImageAttributes, ProfileMerchantImageCreationAttributes>
  implements ProfileMerchantImageAttributes
{
  public id!: string
  public uuid!: string
  public storeId!: number
  public url!: string
  public blobName!: string
  public fileName!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

ProfileMerchantImage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {        // CHAR(36) for UUID v4
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },
    storeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id'
      },
      field: 'store_id',
      unique: true
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    blobName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'profile_images',
    timestamps: true
  }
)
