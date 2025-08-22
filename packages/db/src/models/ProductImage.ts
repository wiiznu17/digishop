import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../db'

export interface ProductImageAttributes {
  id: string
  productId: string
  url: string
  blobName: string
  fileName: string
  isMain: boolean
  order: number
  createdAt?: Date
  updatedAt?: Date
}

export interface ProductImageCreationAttributes
  extends Optional<ProductImageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ProductImage extends Model<ProductImageAttributes, ProductImageCreationAttributes> implements ProductImageAttributes {
  public id!: string
  public productId!: string
  public url!: string
  public blobName!: string
  public fileName!: string
  public isMain!: boolean
  public order!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

ProductImage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      // type: DataTypes.UUID,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
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
    isMain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'PRODUCT_IMAGES',
    timestamps: true
  }
)