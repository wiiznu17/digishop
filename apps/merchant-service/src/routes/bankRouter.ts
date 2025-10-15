import express from 'express'
import {
  addBankAccountToStore,
  getBankAccountList,
  deleteBankAccount,
  setDefaultBankAccount
} from '../controllers/bankController'
import { authenticate, requireApprovedStore } from '../middlewares/middleware'

const router: express.Router = express.Router();

router.get(
  '/bank-list',
  authenticate,
  requireApprovedStore(),
  getBankAccountList
)

router.post(
  '/create',
  authenticate,
  requireApprovedStore(),
  addBankAccountToStore
)

router.patch(
  '/set-default/:accountId',
  authenticate,
  requireApprovedStore(),
  setDefaultBankAccount
)

router.delete(
  '/:bankAccountId',
  authenticate,
  requireApprovedStore(),
  deleteBankAccount
)

export default router