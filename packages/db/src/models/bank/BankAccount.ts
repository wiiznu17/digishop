import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { BankAccountStatus } from '../../types/enum';

export interface BankAccountAttributes {
  id: number;
  storeId: number;
  isDefault: boolean;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  status?: BankAccountStatus
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BankAccountCreationAttributes
  extends Optional<BankAccountAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class BankAccount
  extends Model<BankAccountAttributes, BankAccountCreationAttributes>
  implements BankAccountAttributes {
  public id!: number;
  public storeId!: number;
  public isDefault!: boolean;
  public bankName!: string;
  public accountNumber!: string;
  public accountHolderName!: string;
  public status!: BankAccountStatus;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  static initModel(sequelize: Sequelize): typeof BankAccount {
    BankAccount.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'store_id',
          references: {
            model: 'STORES',
            key: 'id',
          },
        },
        isDefault: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_default',
        },
        bankName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'bank_name',
        },
        accountNumber: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: 'account_number',
        },
        accountHolderName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'account_holder_name',
        },
        status: {
          type: DataTypes.ENUM(...Object.values(BankAccountStatus)),
          allowNull: false,
          defaultValue: BankAccountStatus.PENDING,
          field: 'status',
        },
      },
      {
        sequelize,
        tableName: 'BANK_ACCOUNTS',
        modelName: 'BankAccount',
        timestamps: true,
        underscored: true,
      }
    );

    return BankAccount;
  }
}
