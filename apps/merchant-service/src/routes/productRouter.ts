import { Router } from 'express'
import { authenticate } from '../middlewares/middleware'
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  deleteProductImage,
  updateProductImage
} from '../controllers/productController'
import { upload } from '../middlewares/upload'

const router = Router()

router.get('/', authenticate, getAllProducts)
router.post('/', authenticate, upload.array('images', 5) as any, createProduct)
router.put('/:id', authenticate, upload.array('images', 5) as any , updateProduct)
router.delete('/:id', authenticate, deleteProduct)

router.delete('/:id/images/:imageId', deleteProductImage)
router.patch('/:id/images/:imageId', updateProductImage)

export default router