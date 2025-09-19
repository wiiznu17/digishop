// apps/portal-service/src/routes/adminProductRouter.ts
import { Router } from "express"
import {
  adminListProducts,
  adminSuggestProducts,
  adminGetProductDetail,
  adminModerateProduct,
  adminBulkModerateProducts,
  adminListCategories,
} from "../controllers/productController"

const router = Router()

// Products
router.get("/list", /*authenticateAdmin,*/ adminListProducts)
router.get("/suggest", /*authenticateAdmin,*/ adminSuggestProducts)
router.get("/:uuid", /*authenticateAdmin,*/ adminGetProductDetail)
router.patch("/:uuid/moderate", /*authenticateAdmin,*/ adminModerateProduct)
router.post("/bulk/moderate", /*authenticateAdmin,*/ adminBulkModerateProducts)

// Categories (flat)
router.get("/categories/list", /*authenticateAdmin,*/ adminListCategories)

export default router
