import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../db'

export interface ProductImageAttributes {
  id: string
  productId: number
  url: string
  blobName: string
  fileName: string
  isMain: boolean
  sortOrder: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface ProductImageCreationAttributes
  extends Optional<ProductImageAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

export class ProductImage
  extends Model<ProductImageAttributes, ProductImageCreationAttributes>
  implements ProductImageAttributes
{
  public id!: string
  public productId!: number
  public url!: string
  public blobName!: string
  public fileName!: string
  public isMain!: boolean
  public sortOrder!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null
}

ProductImage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id',
      },
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    blobName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'blob_name',
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_name',
    },
    isMain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_main',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
  },
  {
    sequelize,
    tableName: 'PRODUCT_IMAGES',
    underscored: true,
    timestamps: true,
    paranoid: true,
    defaultScope: {
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    },
    indexes: [
      { fields: ['product_id', 'sort_order'] },
      { fields: ['product_id', 'is_main'] },
    ],
  }
)
