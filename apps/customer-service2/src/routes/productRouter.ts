import { Router } from 'express'
import { searchProduct , getProduct, getAllProduct, getStoreProduct } from '../controllers/productControllers'
import { authenticate, requireApprovedUser } from '../middlewares/middleware'

const router = Router()

router.get('/', getAllProduct)
router.get('/search', searchProduct )
router.get('/:id', getProduct)
router.get('/store/:id', getStoreProduct)



export default router
