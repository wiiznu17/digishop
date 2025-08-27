import { Router } from 'express'
import { getNotify } from '../controllers/paymentControllers'
const router = Router()

router.get('/notify',getNotify)

export default router