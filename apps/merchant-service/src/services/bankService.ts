import { BankAccount, sequelize } from "@digishop/db";
import { setDefaultAccountForStore } from "../helpers/bankAccountService";
import { scheduleBankAccountApproval } from "../helpers/mocks api/bankAccountVerify";
import { bankRepository } from "../repositories/bankRepository";
import {
  AddBankAccountInput,
  DeleteBankAccountInput,
  GetBankAccountListInput,
  SetDefaultBankAccountInput,
} from "../types/bank.types";
import { Transaction } from "sequelize";

export class BankServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? "Bank service error"));
    this.name = "BankServiceError";
  }
}

const isValidStoreId = (storeId: unknown): storeId is number =>
  typeof storeId === "number" && Number.isFinite(storeId) && storeId > 0;

export class BankService {
  private async rollbackIfNeeded(transaction: Transaction) {
    const tx = transaction as Transaction & { finished?: string };
    if (tx.finished) return;
    await transaction.rollback();
  }

  private resolveUserId(userSub?: number | string) {
    const userId = Number(userSub);
    if (!userId) {
      throw new BankServiceError(401, { error: "Unauthorized" });
    }
    return userId;
  }

  private async resolveStoreId(
    userId: number,
    storeId: number | undefined,
    storeNotFoundMessage: string,
    transaction?: Transaction,
  ) {
    if (isValidStoreId(storeId)) {
      return storeId;
    }

    const store = await bankRepository.findStoreByUserId(userId, transaction);
    if (!store) {
      throw new BankServiceError(404, { error: storeNotFoundMessage });
    }

    return store.id;
  }

  async getBankAccountList(input: GetBankAccountListInput) {
    const userId = this.resolveUserId(input.userSub);
    const storeId = await this.resolveStoreId(userId, input.storeId, "Store not found for this user.");

    return bankRepository.findBankAccountsByStoreId(storeId);
  }

  async addBankAccountToStore(input: AddBankAccountInput) {
    const transaction = await sequelize.transaction();

    try {
      const userId = this.resolveUserId(input.userSub);
      const storeId = await this.resolveStoreId(
        userId,
        input.storeId,
        "Store not found for this user.",
        transaction,
      );

      const { accountHolderName, accountNumber, bankName, isDefault } = input.payload;

      const newBankAccount = await bankRepository.createBankAccount(
        {
          storeId,
          accountHolderName,
          accountNumber,
          bankName,
          isDefault: isDefault || false,
        },
        transaction,
      );

      if (isDefault) {
        await setDefaultAccountForStore(storeId, newBankAccount.id, transaction);
        await bankRepository.reloadBankAccount(newBankAccount, transaction);
      }

      await transaction.commit();
      await scheduleBankAccountApproval(newBankAccount.id);

      return newBankAccount;
    } catch (error) {
      await this.rollbackIfNeeded(transaction);
      throw error;
    }
  }

  async setDefaultBankAccount(input: SetDefaultBankAccountInput) {
    const transaction = await sequelize.transaction();

    try {
      const userId = this.resolveUserId(input.userSub);
      const storeId = await this.resolveStoreId(userId, input.storeId, "Store not found.", transaction);

      const accountToSetDefault = await bankRepository.findBankAccountByIdAndStore(
        input.accountId,
        storeId,
        transaction,
      );

      if (!accountToSetDefault) {
        throw new BankServiceError(404, { error: "Bank account not found in your store." });
      }

      await setDefaultAccountForStore(storeId, accountToSetDefault.id, transaction);
      await transaction.commit();

      const updatedAccount = await bankRepository.findBankAccountByPk(accountToSetDefault.id);
      return {
        message: "Default bank account updated successfully.",
        account: updatedAccount,
      };
    } catch (error) {
      await this.rollbackIfNeeded(transaction);
      throw error;
    }
  }

  async deleteBankAccount(input: DeleteBankAccountInput) {
    const userId = this.resolveUserId(input.userSub);
    const storeId = await this.resolveStoreId(userId, input.storeId, "Store not found for this user.");

    const accountToDelete = await bankRepository.findBankAccountByIdAndStore(input.bankAccountId, storeId);
    if (!accountToDelete) {
      throw new BankServiceError(404, { error: "Bank account not found." });
    }

    if (accountToDelete.isDefault) {
      throw new BankServiceError(400, {
        error: "Cannot delete the default bank account. Please set another account as default first.",
      });
    }

    await bankRepository.deleteBankAccount(accountToDelete);
  }
}

export const bankService = new BankService();
