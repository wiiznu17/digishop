import { z } from 'zod'

export const listOrdersSchema = z.object({
  query: z.object({
    storeId: z.string().optional(),
    q: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
    sort: z.string().optional() // e.g. created_at:desc
  })
})

export const statsSchema = z.object({
  query: z.object({
    storeId: z.string().optional()
  })
})

export const patchStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    toStatus: z.string().min(1),
    reason: z.string().optional(),
    actorType: z.string().optional(),
    actorId: z.number().optional()
  })
})

export const patchTrackingSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    trackingNumber: z.string().min(1),
    carrier: z.string().optional()
  })
})
