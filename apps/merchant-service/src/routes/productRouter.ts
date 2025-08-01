import { Router } from 'express'
import { createProduct, deleteProduct, getAllProducts, updateProduct } from '../controllers/productController'
import { authenticate } from '../middlewares/middleware'

const router = Router()

router.get('/', authenticate, getAllProducts)
router.post('/', authenticate, createProduct)
router.put('/:id', authenticate, updateProduct)
router.delete('/:id', authenticate, deleteProduct)

export default router