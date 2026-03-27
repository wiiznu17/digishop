import express from 'express'
import {
  adminListProducts,
  adminSuggestProducts,
  adminGetProductDetail,
  adminModerateProduct,
  adminBulkModerateProducts
  // adminListCategories,
} from '../controllers/productController'
import { requirePerms } from '../middlewares/auth'

const router: express.Router = express.Router()

router.get('/list', requirePerms('PRODUCTS_READ'), adminListProducts)

router.get('/suggest', requirePerms('PRODUCTS_READ'), adminSuggestProducts)

router.get('/:uuid', requirePerms('PRODUCTS_READ'), adminGetProductDetail)

router.patch(
  '/:uuid/moderate',
  requirePerms('PRODUCTS_UPDATE'),
  adminModerateProduct
)

router.post(
  '/bulk/moderate',
  requirePerms('PRODUCTS_UPDATE'),
  adminBulkModerateProducts
)

// Categories (flat)
// router.get("/categories/list",
//   requirePerms("CATEGORIES_READ, PRODUCTS_READ"),
//   adminListCategories
// );

export default router
