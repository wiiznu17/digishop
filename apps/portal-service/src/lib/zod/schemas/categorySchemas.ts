import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100),
  parentUuid: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  iconUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0)
})

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  parentUuid: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  iconUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional()
})

export const MoveProductsSchema = z.object({
  targetCategoryUuid: z.string().min(1, 'Target category UUID is required')
})
