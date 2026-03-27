import express from 'express'
import * as ctrl from '../controllers/categoryController'
import { requirePerms } from '../middlewares/auth'
import { zodValidate } from '../lib/zod/validate'
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  MoveProductsSchema
} from '../lib/zod/schemas/categorySchemas'

const router: express.Router = express.Router()

router.get('/list', requirePerms('CATEGORIES_READ'), ctrl.listCategories)

router.get('/suggest', requirePerms('CATEGORIES_READ'), ctrl.suggestCategories)

router.get('/:uuid', requirePerms('CATEGORIES_READ'), ctrl.getCategoryDetail)

router.post(
  '/',
  requirePerms('CATEGORIES_CREATE'),
  zodValidate(CreateCategorySchema),
  ctrl.createCategory
)

router.patch(
  '/:uuid',
  requirePerms('CATEGORIES_UPDATE'),
  zodValidate(UpdateCategorySchema),
  ctrl.updateCategory
)

router.delete('/:uuid', requirePerms('CATEGORIES_DELETE'), ctrl.deleteCategory)

router.post(
  '/:uuid/move-products',
  requirePerms('CATEGORIES_UPDATE, PRODUCTS_UPDATE'),
  zodValidate(MoveProductsSchema),
  ctrl.moveProducts
)

export default router
