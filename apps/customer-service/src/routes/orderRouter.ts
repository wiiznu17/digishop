import { Router } from 'express'
import { createOrder, createOrderId , createCart, deleteOrder,deleteChart,findUserOrder , findOrder, findShipping, findUserCart, updateOrderStatus, cancelOrder } from '../controllers/orderControllers'
const router = Router()

router.get('/shiptype', findShipping)
router.get('/:userId/:id',findOrder)
router.get('/user/id/:id', findUserOrder)
router.get('/cart/user/:id', findUserCart)
router.post('/create/id',createOrderId)
router.post('/create',createOrder)
router.post('/create/cart', createCart)
router.patch('/delete/:id', deleteOrder)
router.post('/cart/id', deleteChart)
router.patch('/status/:id', updateOrderStatus)
router.patch('/cancel/:id', cancelOrder)
export default router