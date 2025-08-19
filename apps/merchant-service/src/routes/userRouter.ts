import { Router } from 'express'
import { createStoreForUser, deleteUser, getMerchantProfile, updateMerchantProfile } from '../controllers/userController'
import { authenticate } from '../middlewares/middleware'
import { upload } from '../middlewares/upload'

const router = Router()

router.get(
  '/profile',
  authenticate,
  getMerchantProfile
)

router.post(
  '/register',
  createStoreForUser
)

router.delete(
  '/:id',
  deleteUser
)

router.put(
  "/profile",
  authenticate,
  upload.array("images", 1) as any,
  updateMerchantProfile
)

export default router
