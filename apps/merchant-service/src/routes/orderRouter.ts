import express from 'express'
import {
  getOrdersSummary,
  listOrders,
  updateOrder,
  getOrderById
} from '../controllers/orderController'
import {
  authenticate,
  eitherAuth,
  requireApprovedStore,
  serviceAuth
} from '../middlewares/middleware'
import { attachStore } from '../middlewares/storeMiddleware'
import { zodValidate } from '../lib/zod/validate'
import { UpdateOrderSchema } from '../lib/zod/schemas/orderSchemas'

const router: express.Router = express.Router()

// เฉพาะหน้าเว็บ: cookie-JWT เท่านั้น
router.get('/', authenticate, requireApprovedStore(), attachStore(), listOrders)
router.get(
  '/summary',
  authenticate,
  requireApprovedStore(),
  attachStore(),
  getOrdersSummary
)

router.get(
  '/:orderId',
  authenticate,
  requireApprovedStore(),
  attachStore(),
  getOrderById
)

// PATCH: อนุญาตทั้ง worker (service token) และ user (cookie)
router.patch(
  '/:orderId',
  eitherAuth([serviceAuth, authenticate]),
  requireApprovedStore({ allowAdminBypass: true, allowServiceBypass: true }),
  attachStore({ allowServiceBypass: true }),
  zodValidate(UpdateOrderSchema),
  updateOrder
)

export default router
