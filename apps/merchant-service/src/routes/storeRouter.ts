import express from 'express'
import { authenticate } from '../middlewares/middleware'
import { getStoreStatus } from '../controllers/storeController'

const router: express.Router = express.Router()

router.get('/status', authenticate, getStoreStatus)

export default router
