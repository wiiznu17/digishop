import { z } from 'zod'

export const UpdateOrderSchema = z.object({
  status: z.enum([
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED'
  ]),
  carrierId: z.number().int().positive().optional(),
  trackingNumber: z.string().optional()
})
