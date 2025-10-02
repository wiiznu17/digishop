import { Router } from "express";
import { authenticate, requireApprovedStore } from "../middlewares/middleware";
import { upload } from "../middlewares/upload";

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
  updateProductItem,
} from "../controllers/productController";

const router = Router();

// List & Detail
router.get("/suggest", authenticate, requireApprovedStore(), suggestProducts);
router.get("/list", authenticate, requireApprovedStore(), getProductList);
router.get("/:productUuid", authenticate, requireApprovedStore(), getProductDetail);
router.get("/categories/list", authenticate, requireApprovedStore(), listCategories);

// Create / Update / Delete / Duplicate
router.delete("/:productUuid", authenticate, deleteProduct);
router.post("/:productUuid/duplicate", authenticate, requireApprovedStore(), duplicateProduct);
router.post(
  "/desired",
  authenticate,
  requireApprovedStore(),
  upload.fields([
    { name: "productImages", maxCount: 20 },
    { name: "itemImages", maxCount: 50 }
  ]) as any,
  syncCreateDesiredProduct
);

router.put(
  "/:productUuid/desired",
  authenticate,
  requireApprovedStore(),
  upload.fields([
    { name: "productImages", maxCount: 20 },
    { name: "itemImages", maxCount: 50 }
  ]) as any,
  syncUpdateDesiredProduct
);

// Bulk
router.patch("/bulk/status", authenticate, requireApprovedStore(), bulkUpdateProductStatus);
router.delete("/bulk/delete", authenticate, requireApprovedStore(), bulkDeleteProducts);

// items
router.put("/:productUuid/items/:itemUuid", authenticate, requireApprovedStore(), updateProductItem);

export default router;
