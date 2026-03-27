import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import type {
  NonAttribute,
  Association,
  HasManyGetAssociationsMixin
} from 'sequelize'
import type { VariationOption } from './VariationOption'

export interface VariationAttributes {
  id: number
  uuid: string
  productId: number
  name: string // color, size
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface VariationCreationAttributes
  extends Optional<
    VariationAttributes,
    'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

export class Variation
  extends Model<VariationAttributes, VariationCreationAttributes>
  implements VariationAttributes
{
  public id!: number
  public uuid!: string
  public productId!: number
  public name!: string

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  declare options?: NonAttribute<VariationOption[]>

  declare getOptions: HasManyGetAssociationsMixin<VariationOption>

  declare static associations: {
    options: Association<Variation, VariationOption>
  }

  static initModel(sequelize: Sequelize): typeof Variation {
    Variation.init(
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
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'product_id'
        },
        name: {
          type: DataTypes.STRING(64),
          allowNull: false
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
        tableName: 'VARIATIONS',
        modelName: 'Variation',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { name: 'uq_variations_uuid', fields: ['uuid'], unique: true },
          { name: 'ix_variations_product', fields: ['product_id'] },
          { name: 'ix_variations_product_name', fields: ['product_id', 'name'] }
        ]
      }
    )
    return Variation
  }
}
