import { Router } from 'express'
import {
  createOrder,
  createOrderId,
  createCart,
  deleteOrder,
  deleteChart,
  findUserOrder,
  findOrder,
  findShipping,
  findUserCart,
  updateOrderStatus,
  cancelOrder,
  revokeCancelOrder,
  customerCancel,
  customerCancelV2
} from '../controllers/orderControllers'
import { authenticate, requireApprovedUser } from '../middlewares/middleware'

const router = Router()

router.get('/:userId/:id', authenticate, requireApprovedUser(), findOrder) //อย่าลืมใส่
router.get('/shiptype', authenticate, requireApprovedUser(), findShipping)
router.get('/user/id/:id', authenticate, requireApprovedUser(), findUserOrder)
router.get('/cart/user/:id', authenticate, requireApprovedUser(), findUserCart)
router.post('/create/id', authenticate, requireApprovedUser(), createOrderId)
router.post('/create', authenticate, requireApprovedUser(), createOrder)
router.post('/create/cart', authenticate, requireApprovedUser(), createCart)
router.patch('/delete/:id', authenticate, requireApprovedUser(), deleteOrder)
router.post('/cart/id', authenticate, requireApprovedUser(), deleteChart)
router.patch(
  '/status/:id',
  authenticate,
  requireApprovedUser(),
  updateOrderStatus
)
router.patch('/cancel/:id', authenticate, requireApprovedUser(), cancelOrder)
router.patch('/customer/cancel/:id', customerCancelV2)
router.post(
  '/revoke/cancel/:id',
  authenticate,
  requireApprovedUser(),
  revokeCancelOrder
)
export default router
