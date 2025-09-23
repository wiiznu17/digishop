// apps/portal-service/src/routes/productRouter.ts
import { Router } from "express";
import {
  adminListProducts,
  adminSuggestProducts,
  adminGetProductDetail,
  adminModerateProduct,
  adminBulkModerateProducts,
  adminListCategories,
} from "../controllers/productController";
import { authenticateAdmin, requirePerms } from "../middlewares/auth";

const router = Router();

router.get("/list",
  requirePerms("PRODUCT.READ"),
  adminListProducts);
router.get("/suggest",
  requirePerms("PRODUCT.READ"),
  adminSuggestProducts);
router.get("/:uuid",
  requirePerms("PRODUCT.READ"),
  adminGetProductDetail);
router.patch("/:uuid/moderate",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  adminModerateProduct);
router.post("/bulk/moderate",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  adminBulkModerateProducts);

// Categories (flat)
router.get("/categories/list",
  requirePerms("CATEGORY.MANAGE"),
  adminListCategories);

export default router;
