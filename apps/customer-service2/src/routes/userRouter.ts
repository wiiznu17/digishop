import { Router } from 'express'
import {
  createUser,
  deleteUser,
  findaddressUser,
  finduserDetail,
  createAddress,
  updateUserName,
  updateAddress,
  deleteAddress,
  refreshTokenAuth,
  sendMailResetPassword,
  resetPassword,
  sendvaildateEmail
} from '../controllers/userControllers'
import { authenticate } from '../middlewares/middleware'
import { zodValidate } from '../lib/zod/validate'
import {
  RegisterUserSchema,
  UpdateUserSchema,
  AddressSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema
} from '../lib/zod/schemas/userSchemas'

const router = Router()

router.post('/verified-email', sendvaildateEmail) // data
router.post('/register', zodValidate(RegisterUserSchema), createUser) //get token
router.post('/delete/:id', deleteUser)
//get user
router.post('/address', authenticate, zodValidate(AddressSchema), createAddress)
router.get('/address/:id', authenticate, findaddressUser)
router.get('/detail/:id', authenticate, finduserDetail)
router.patch(
  '/address/:id',
  authenticate,
  zodValidate(AddressSchema),
  updateAddress
)
router.patch(
  '/name/:id',
  authenticate,
  zodValidate(UpdateUserSchema),
  updateUserName
)
router.delete('/address/:id', authenticate, deleteAddress)
router.post('/refresh-token', refreshTokenAuth)
router.patch('/reset-password', zodValidate(ResetPasswordSchema), resetPassword)
router.post(
  '/forgot-password',
  zodValidate(ForgotPasswordSchema),
  sendMailResetPassword
)

export default router
