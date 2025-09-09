import { Router } from 'express'
import { getCallBack, getNotify,testRes  } from '../controllers/paymentControllers'
const router = Router()

router.post('/callback',getCallBack)
router.post('/notify',getNotify)
router.get('/test',testRes )
export default router