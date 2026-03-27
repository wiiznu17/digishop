import express from 'express'
import { requirePerms } from '../middlewares/auth'
import {
  adminListOrders,
  adminGetOrderDetail,
  adminSuggestOrders,
  adminSuggestCustomerEmails,
  adminSuggestStoreName
} from '../controllers/orderController'

const router: express.Router = express.Router()

router.get('/list', requirePerms('ORDERS_READ'), adminListOrders)

router.get('/:id/detail', requirePerms('ORDERS_READ'), adminGetOrderDetail)

router.get('/suggest', requirePerms('ORDERS_READ'), adminSuggestOrders)

router.get(
  '/customer-suggest',
  requirePerms('ORDERS_READ'),
  adminSuggestCustomerEmails
)

router.get(
  '/store-name-suggest',
  requirePerms('ORDERS_READ'),
  adminSuggestStoreName
)

export default router
