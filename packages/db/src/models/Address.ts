import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { AddressType } from '../types/enum';

export interface AddressAttributes {
  id: number;
  userId: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  addressType: AddressType; // home, office
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddressCreationAttributes
  extends Optional<AddressAttributes, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'> {}

export class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  public id!: number;
  public userId!: number;
  public recipientName!: string;
  public phone!: string;
  public addressLine!: string;
  public province!: string;
  public postalCode!: string;
  public isDefault!: boolean;
  public addressType!: AddressType;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Address {
    Address.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'user_id',
        },
        recipientName: {
          type: DataTypes.STRING(191),
          allowNull: false,
          field: 'recipient_name',
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        addressLine: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'address_line',
        },
        province: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        postalCode: {
          type: DataTypes.STRING(10),
          allowNull: false,
          field: 'postal_code',
        },
        isDefault: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_default',
        },
        addressType: {
          type: DataTypes.ENUM(...Object.values(AddressType)),
          allowNull: true,
          field: 'address_type',
        },
      },
      {
        sequelize,
        tableName: 'ADDRESSES',
        modelName: 'Address',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return Address;
  }
}