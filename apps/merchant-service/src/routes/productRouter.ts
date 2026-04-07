import express from 'express'
import { authenticate, requireApprovedStore } from '../middlewares/middleware'
import { ensureStore } from '../middlewares/storeMiddleware'
import { upload } from '../middlewares/upload'
import { zodValidate } from '../lib/zod/validate'
import {
  BulkUpdateProductStatusSchema,
  BulkDeleteProductsSchema,
  UpdateProductItemSchema
} from '../lib/zod/schemas/productSchemas'

import {
  // list/detail
  getProductList,
  getProductDetail,
  deleteProduct,
  duplicateProduct,
  // bulk
  bulkUpdateProductStatus,
  bulkDeleteProducts,
  suggestProducts,
  listCategories,
  syncCreateDesiredProduct,
  syncUpdateDesiredProduct,
  updateProductItem
} from '../controllers/productController'

const router: express.Router = express.Router()

// List & Detail
router.get(
  '/suggest',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  suggestProducts
)
router.get(
  '/list',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  getProductList
)
router.get(
  '/:productUuid',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  getProductDetail
)
router.get('/categories/list', authenticate, listCategories)

// Create / Update / Delete / Duplicate
router.delete('/:productUuid', authenticate, ensureStore, deleteProduct)
router.post(
  '/:productUuid/duplicate',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  duplicateProduct
)
router.post(
  '/desired',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  upload.fields([
    { name: 'productImages', maxCount: 20 },
    { name: 'itemImages', maxCount: 50 }
  ]) as any,
  syncCreateDesiredProduct
)

router.put(
  '/:productUuid/desired',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  upload.fields([
    { name: 'productImages', maxCount: 5 },
    { name: 'itemImages', maxCount: 50 }
  ]) as any,
  syncUpdateDesiredProduct
)

// Bulk
router.patch(
  '/bulk/status',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  zodValidate(BulkUpdateProductStatusSchema),
  bulkUpdateProductStatus
)
router.delete(
  '/bulk/delete',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  zodValidate(BulkDeleteProductsSchema),
  bulkDeleteProducts
)

// items
router.put(
  '/:productUuid/items/:itemUuid',
  authenticate,
  requireApprovedStore(),
  ensureStore,
  zodValidate(UpdateProductItemSchema),
  updateProductItem
)

export default router
