// routes/bankAccountRoutes.ts
import { Router } from 'express'
import {
  addBankAccountToStore,
  getBankAccountList,
  deleteBankAccount,
  setDefaultBankAccount
} from '../controllers/bankController'
import { authenticate } from '../middlewares/middleware'

const router = Router()

router.get(
  '/bank-list',
  authenticate,
  getBankAccountList
)

router.post(
  '/create',
  authenticate,
  addBankAccountToStore
)

router.patch(
  '/set-default/:accountId',
  authenticate,
  setDefaultBankAccount
)

router.delete(
  '/:bankAccountId',
  authenticate,
  deleteBankAccount
)

export default router