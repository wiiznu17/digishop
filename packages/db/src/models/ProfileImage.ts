import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../db'

export interface ProfileMerchantImageAttributes {
  id: string
  storeId: number
  url: string
  blobName: string
  fileName: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ProfileMerchantImageCreationAttributes
  extends Optional<ProfileMerchantImageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ProfileMerchantImage
  extends Model<ProfileMerchantImageAttributes, ProfileMerchantImageCreationAttributes>
  implements ProfileMerchantImageAttributes
{
  public id!: string
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
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id'
      },
      field: 'store_id'
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
