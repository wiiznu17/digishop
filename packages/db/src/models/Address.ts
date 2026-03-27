import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { AddressType } from '../types/enum'

export interface AddressAttributes {
  id: number
  userId: number
  recipientName: string
  phone: string
  addressNumber: string
  building: string
  subStreet: string
  street: string
  subdistrict: string
  district: string
  province: string
  postalCode: string
  country: string
  isDefault: boolean
  addressType: AddressType // home, office
  createdAt?: Date
  updatedAt?: Date
}

export interface AddressCreationAttributes
  extends Optional<
    AddressAttributes,
    'id' | 'isDefault' | 'createdAt' | 'updatedAt'
  > {}

export class Address
  extends Model<AddressAttributes, AddressCreationAttributes>
  implements AddressAttributes
{
  public id!: number
  public userId!: number
  public recipientName!: string
  public phone!: string
  public addressNumber!: string
  public building!: string
  public subStreet!: string
  public street!: string
  public subdistrict!: string
  public district!: string
  public province!: string
  public postalCode!: string
  public country!: string
  public isDefault!: boolean
  public addressType!: AddressType
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initModel(sequelize: Sequelize): typeof Address {
    Address.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'user_id'
        },
        recipientName: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'recipient_name'
        },
        phone: {
          type: DataTypes.STRING(10),
          allowNull: false
        },
        addressNumber: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'address_number'
        },
        building: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'building'
        },
        subStreet: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'sub_street'
        },
        street: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'street'
        },
        subdistrict: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'sub_district'
        },
        district: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'district'
        },
        province: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        postalCode: {
          type: DataTypes.STRING(5),
          allowNull: false,
          field: 'postal_code'
        },
        country: {
          type: DataTypes.STRING(191),
          allowNull: false,
          defaultValue: 'Thailand'
        },
        isDefault: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_default'
        },
        addressType: {
          type: DataTypes.ENUM(...Object.values(AddressType)),
          allowNull: true,
          field: 'address_type'
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
        }
      },
      {
        sequelize,
        tableName: 'ADDRESSES',
        modelName: 'Address',
        paranoid: true, // เปิด soft delete
        deletedAt: 'deleted_at' // ชื่อคอลัมน์ soft delete
      }
    )
    return Address
  }
}
