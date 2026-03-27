import { z } from 'zod'
import { PasswordSchema } from '../../passwordPolicy'

export const AcceptInviteBody = z.object({
  token: z.string().min(1, 'Missing token.'),
  name: z.string().trim().max(120).optional(),
  password: PasswordSchema
})

export const ResetConfirmBody = z.object({
  token: z.string().min(1, 'Missing token.'),
  password: PasswordSchema
})

export const IdParam = z.object({
  id: z.coerce.number().int().positive('Invalid id')
})
