import express from 'express'
import {
  addBankAccountToStore,
  getBankAccountList,
  deleteBankAccount,
  setDefaultBankAccount
} from '../controllers/bankController'
import { authenticate, requireApprovedStore } from '../middlewares/middleware'
import { attachStore } from '../middlewares/storeMiddleware'
import { zodValidate } from '../lib/zod/validate'
import { AddBankAccountSchema } from '../lib/zod/schemas/storeSchemas'

const router: express.Router = express.Router()

router.get(
  '/bank-list',
  authenticate,
  requireApprovedStore(),
  attachStore(),
  getBankAccountList
)

router.post(
  '/create',
  authenticate,
  requireApprovedStore(),
  attachStore(),
  zodValidate(AddBankAccountSchema),
  addBankAccountToStore
)

router.patch(
  '/set-default/:accountId',
  authenticate,
  requireApprovedStore(),
  attachStore(),
  setDefaultBankAccount
)

router.delete(
  '/:bankAccountId',
  authenticate,
  requireApprovedStore(),
  attachStore(),
  deleteBankAccount
)

export default router
