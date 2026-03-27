import { Router } from 'express'
import { getCallBack, getNotify } from '../controllers/paymentControllers'
import { authenticate, requireApprovedUser } from '../middlewares/middleware'

const router = Router()

router.post('/callback', getCallBack)
router.post('/notify', getNotify)
export default router
