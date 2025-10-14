import { Router } from 'express'
import { getCallBack, getNotify  } from '../controllers/paymentControllers'
import { authenticate, requireApprovedUser } from '../middlewares/middleware'

const router = Router()

router.post('/callback',authenticate,requireApprovedUser(),getCallBack)
router.post('/notify',authenticate,requireApprovedUser(),getNotify)
export default router