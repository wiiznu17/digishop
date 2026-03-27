import { z } from 'zod'

export const CreateStoreSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  description: z.string().max(500).optional()
})

export const UpdateStoreSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional()
})

export const AddBankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required')
})
