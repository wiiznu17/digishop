import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/middleware'
import { bankService } from '../services/bankService'
import { AddBankAccountPayload } from '../types/bank.types'
import { asyncHandler } from '../utils/asyncHandler'

export const getBankAccountList = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await bankService.getBankAccountList({
      userSub: req.user?.sub,
      storeId: req.store?.id
    })

    return res.status(200).json(result)
  }
)

export const addBankAccountToStore = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as AddBankAccountPayload
    const result = await bankService.addBankAccountToStore({
      userSub: req.user?.sub,
      storeId: req.store?.id,
      payload
    })

    return res.status(201).json(result)
  }
)

export const setDefaultBankAccount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { accountId } = req.params as { accountId: string }
    const result = await bankService.setDefaultBankAccount({
      accountId,
      userSub: req.user?.sub,
      storeId: req.store?.id
    })

    return res.status(200).json(result)
  }
)

export const deleteBankAccount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bankAccountId } = req.params as { bankAccountId: string }
    await bankService.deleteBankAccount({
      bankAccountId,
      userSub: req.user?.sub,
      storeId: req.store?.id
    })

    return res.status(204).send()
  }
)
