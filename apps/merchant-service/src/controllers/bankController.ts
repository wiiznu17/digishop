import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { BankServiceError, bankService } from "../services/bankService";
import { AddBankAccountPayload } from "../types/bank.types";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error ?? "Unknown error");

const handleBankControllerError = (res: Response, label: string, error: unknown) => {
  if (error instanceof BankServiceError) {
    return res.status(error.statusCode).json(error.body);
  }

  console.error(label, error);
  return res.status(500).json({
    error: "An internal server error occurred",
    details: errorMessage(error),
  });
};

export const getBankAccountList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await bankService.getBankAccountList({
      userSub: req.user?.sub,
      storeId: req.store?.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleBankControllerError(res, "Error fetching bank account list:", error);
  }
};

export const addBankAccountToStore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = req.body as AddBankAccountPayload;
    const result = await bankService.addBankAccountToStore({
      userSub: req.user?.sub,
      storeId: req.store?.id,
      payload,
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleBankControllerError(res, "Error adding bank account:", error);
  }
};

export const setDefaultBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params as { accountId: string };
    const result = await bankService.setDefaultBankAccount({
      accountId,
      userSub: req.user?.sub,
      storeId: req.store?.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleBankControllerError(res, "Error setting default bank account:", error);
  }
};

export const deleteBankAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bankAccountId } = req.params as { bankAccountId: string };
    await bankService.deleteBankAccount({
      bankAccountId,
      userSub: req.user?.sub,
      storeId: req.store?.id,
    });

    return res.status(204).send();
  } catch (error) {
    return handleBankControllerError(res, "Error deleting bank account:", error);
  }
};
