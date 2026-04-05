import { z } from 'zod'

export const BulkUpdateProductStatusSchema = z.object({
  productUuids: z
    .array(z.string())
    .min(1, 'At least one product UUID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE'])
})

export const BulkDeleteProductsSchema = z.object({
  productUuids: z
    .array(z.string())
    .min(1, 'At least one product UUID is required')
})

export const UpdateProductItemSchema = z.object({
  sku: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  stockDelta: z.number().int().optional(),
  priceMinor: z.number().int().min(0).optional(),
  imageUrl: z.string().url().nullable().optional(),
  isEnable: z.boolean().optional()
})
