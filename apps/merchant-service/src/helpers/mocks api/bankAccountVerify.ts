import { BankAccount } from "@digishop/db/src/models/bank/BankAccount";
import { BankAccountStatus } from "@digishop/db/src/types/enum";

// ใช้ async/await กับ delay
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scheduleBankAccountApproval(bankAccountId: number | string) {
  await delay(3000);
  try {
    await BankAccount.update(
      { status: BankAccountStatus.VERIFIED },
      { where: { id: bankAccountId } }
    );
  } catch (err) {
    await BankAccount.update(
      { status: BankAccountStatus.VERIFIED },
      { where: { id: bankAccountId } }
    );
  }
}