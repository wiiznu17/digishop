import { BankAccount, Store } from "@digishop/db";
import { CreationAttributes, Transaction } from "sequelize";

export class BankRepository {
  async findStoreByUserId(userId: number, transaction?: Transaction) {
    return Store.findOne({ where: { userId }, transaction });
  }

  async findBankAccountsByStoreId(storeId: number) {
    return BankAccount.findAll({
      where: { storeId },
      order: [
        ["isDefault", "DESC"],
        ["created_at", "DESC"],
      ],
    });
  }

  async createBankAccount(payload: CreationAttributes<BankAccount>, transaction: Transaction) {
    return BankAccount.create(payload, { transaction });
  }

  async reloadBankAccount(account: BankAccount, transaction: Transaction) {
    return account.reload({ transaction });
  }

  async findBankAccountByIdAndStore(
    accountId: string | number,
    storeId: number,
    transaction?: Transaction,
  ) {
    return BankAccount.findOne({
      where: { id: accountId, storeId },
      transaction,
    });
  }

  async findBankAccountByPk(accountId: string | number, transaction?: Transaction) {
    return BankAccount.findByPk(accountId, { transaction });
  }

  async deleteBankAccount(account: BankAccount, transaction?: Transaction) {
    return account.destroy({ transaction });
  }
}

export const bankRepository = new BankRepository();
