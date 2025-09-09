import { Router } from 'express'
import { createOrder, createOrderId ,deleteOrder, findUserOrder , findOrder, findShipping } from '../controllers/orderControllers'
const router = Router()

router.get('/shiptype', findShipping)
router.get('/:userId/:id',findOrder)
router.get('/user/id/:id', findUserOrder)
router.post('/create/id',createOrderId)
router.post('/create',createOrder)
router.patch('/cancel/:id', deleteOrder)
export default router