import { Router } from 'express'
import { createOrder, deleteOrder, findUserOrder , findOrder } from '../controllers/orderControllers'
const router = Router()

// router.get('/:id',findOrder)
router.get('/user/:id', findUserOrder)
router.post('/create',createOrder)
router.patch('/cancel/:id', deleteOrder)

export default router