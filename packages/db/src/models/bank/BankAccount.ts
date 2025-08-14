import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface BankAccountAttributes {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BankAccountCreationAttributes
  extends Optional<BankAccountAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class BankAccount
  extends Model<BankAccountAttributes, BankAccountCreationAttributes>
  implements BankAccountAttributes {
  public id!: number;
  public bankName!: string;
  public accountNumber!: string;
  public accountHolderName!: string;
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
      },
      {
        sequelize,
        tableName: 'BANK_ACCOUNTS',
        modelName: 'BankAccount',
        timestamps: true,
      }
    );

    return BankAccount;
  }
}
