import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(4, 'Password must be at least 6 characters')
})
