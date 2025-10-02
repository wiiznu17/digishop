import { Router } from 'express'
import { authenticate } from '../middlewares/middleware'
import { getStoreStatus } from '../controllers/storeController'

const router = Router()

router.get(
  "/status",
  authenticate,
  getStoreStatus
)

export default router
