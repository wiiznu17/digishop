import { Router } from 'express'
import { searchProduct , getProduct, getAllProduct } from '../controllers/productControllers'

const router = Router()

router.get('/', getAllProduct)
router.get('/search', searchProduct )
router.get('/:id', getProduct)



export default router
