import { BankAccount } from '@digishop/db'
import { Transaction } from 'sequelize'

/**
 * Sets a specific bank account as the default for a store,
 * and ensures all other accounts for that store are not default.
 * @param storeId The ID of the store.
 * @param newDefaultAccountId The ID of the bank account to set as default.
 * @param transaction The Sequelize transaction object.
 */
export const setDefaultAccountForStore = async (
  storeId: number,
  newDefaultAccountId: number,
  transaction: Transaction
) => {
  // Step 1: Set all bank accounts for this store to isDefault: false
  await BankAccount.update(
    { isDefault: false },
    {
      where: { storeId },
      transaction
    }
  )

  // Step 2: Set the chosen bank account to isDefault: true
  await BankAccount.update(
    { isDefault: true },
    {
      where: { id: newDefaultAccountId, storeId }, // Ensure it belongs to the store
      transaction
    }
  )
}
