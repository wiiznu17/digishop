import { Router } from 'express'
import {
  createOrder,
  createOrderId ,
  createCart,
  deleteOrder,
  deleteChart,
  findUserOrder,
  findOrder,
  findShipping,
  findUserCart,
  updateOrderStatus,
  cancelOrder, revokeCancelOrder, customerCancel,
  customerCancelV2
} from '../controllers/orderControllers'
import { authenticate, requireApprovedUser,authenticateToken, } from '../middlewares/middleware'

const router = Router()

router.get('/:userId/:id',authenticate,authenticateToken,requireApprovedUser(),findOrder) //อย่าลืมใส่
router.get('/shiptype',authenticate,authenticateToken,requireApprovedUser(), findShipping)
router.get('/user/id/:id',authenticate,authenticateToken,requireApprovedUser(),findUserOrder)
router.get('/cart/user/:id',authenticate,authenticateToken,requireApprovedUser(), findUserCart)
router.post('/create/id',authenticate,authenticateToken,requireApprovedUser(),createOrderId)
router.post('/create',authenticate,authenticateToken,requireApprovedUser(),createOrder)
router.post('/create/cart',authenticate,authenticateToken,requireApprovedUser(),createCart)
router.patch('/delete/:id',authenticate,authenticateToken,requireApprovedUser(),deleteOrder)
router.post('/cart/id',authenticate,authenticateToken,requireApprovedUser(),deleteChart)
router.patch('/status/:id',authenticate,authenticateToken,requireApprovedUser(),updateOrderStatus)
router.patch('/cancel/:id',authenticate,authenticateToken,requireApprovedUser(),cancelOrder)
router.patch('/customer/cancel/:id',customerCancelV2) 
router.post('/revoke/cancel/:id',authenticate,authenticateToken,requireApprovedUser(),revokeCancelOrder)
export default router