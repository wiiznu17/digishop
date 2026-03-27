import { z } from 'zod'

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional()
})

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional()
})

export const AddressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address1: z.string().min(1, 'Address line 1 is required'),
  address2: z.string().optional(),
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  subdistrict: z.string().min(1, 'Subdistrict is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  isDefault: z.boolean().optional().default(false)
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
})
