// routes/bankAccountRoutes.ts
import { Router } from 'express'
import {
  addBankAccountToStore,
  getBankAccountList,
  setDefaultBankAccount,
  deleteBankAccount // <-- Import function ใหม่
} from '../controllers/bankController' // <-- แก้ชื่อไฟล์ controller ให้ถูกต้อง
import { authenticate } from '../middlewares/middleware'

const router = Router()

// GET /api/bank-accounts/ - ดึงรายการบัญชีธนาคารทั้งหมดของร้านค้า
router.get(
  '/bank-list',
  authenticate,
  getBankAccountList
)

// POST /api/bank-accounts/ - เพิ่มบัญชีธนาคารใหม่ให้กับร้านค้า
router.post(
  '/create',
  authenticate,
  addBankAccountToStore
)

// PUT /api/bank-accounts/:bankAccountId/set-default - ตั้งค่าบัญชีเป็นบัญชีหลัก
router.put(
  '/:bankAccountId/set-default',
  authenticate,
  setDefaultBankAccount
)

// DELETE /api/bank-accounts/:bankAccountId - ลบบัญชีธนาคาร
router.delete(
  '/:bankAccountId',
  authenticate,
  deleteBankAccount
)

export default router