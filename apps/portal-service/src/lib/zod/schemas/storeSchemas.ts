import { z } from 'zod'

export const ApproveStoreSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
  reason: z.string().optional()
})
