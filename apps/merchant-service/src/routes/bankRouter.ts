import express from 'express'
import {
  addBankAccountToStore,
  getBankAccountList,
  deleteBankAccount,
  setDefaultBankAccount
} from '../controllers/bankController'
import { authenticate, requireApprovedStore } from '../middlewares/middleware'
import { attachStore } from "../middlewares/storeMiddleware"

const router: express.Router = express.Router();

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
