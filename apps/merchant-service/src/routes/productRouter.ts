import { Router } from "express";
import { authenticate } from "../middlewares/middleware";
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
} from "../controllers/productController";

const router = Router();

// List & Detail
router.get("/suggest", authenticate, suggestProducts);
router.get("/list", authenticate, getProductList);
router.get("/:productUuid", authenticate, getProductDetail);
router.get("/categories/list", authenticate, listCategories);

// Create / Update / Delete / Duplicate
router.delete("/:productUuid", authenticate, deleteProduct);
router.post("/:productUuid/duplicate", authenticate, duplicateProduct);
router.post(
  "/desired",
  authenticate,
  upload.fields([
    { name: "productImages", maxCount: 20 },
    { name: "itemImages", maxCount: 500 }
  ]) as any,
  syncCreateDesiredProduct
);

router.put(
  "/:productUuid/desired",
  authenticate,
  upload.fields([
    { name: "productImages", maxCount: 20 },
    { name: "itemImages", maxCount: 500 }
  ]) as any,
  syncUpdateDesiredProduct
);

// Bulk
router.patch("/bulk/status", authenticate, bulkUpdateProductStatus);
router.delete("/bulk/delete", authenticate, bulkDeleteProducts);

export default router;
