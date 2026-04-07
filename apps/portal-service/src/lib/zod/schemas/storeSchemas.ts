import { z } from 'zod'

export const ApproveStoreSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'BANNED']).optional().default('APPROVED'),
    reason: z.string().optional()
  })
  .optional()
  .default({ status: 'APPROVED' })
