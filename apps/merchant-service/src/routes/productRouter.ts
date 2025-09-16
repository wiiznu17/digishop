import { Router } from "express";
import { authenticate } from "../middlewares/middleware";
import { upload } from "../middlewares/upload";

import {
  // list/detail
  getProductList,
  getProductDetail,
  // product CRUD
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  // images
  addProductImages,
  deleteProductImage,
  updateProductImage,
  reorderProductImages,
  // bulk
  bulkUpdateProductStatus,
  bulkDeleteProducts,
  // variations
  createVariation,
  updateVariation,
  deleteVariation,
  createVariationOption,
  updateVariationOption,
  deleteVariationOption,
  reorderVariationOptions,
  // items
  createProductItem,
  updateProductItem,
  deleteProductItem,
  setItemConfigurations,
  suggestProducts,
  listCategories,
  deleteProductItemImage,
  upsertProductItemImage,
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
// router.post("/", authenticate, upload.array("images", 10) as any, createProduct);
// router.put("/:productUuid", authenticate, upload.array("images", 10) as any, updateProduct);
router.delete("/:productUuid", authenticate, deleteProduct);
router.post("/:productUuid/duplicate", authenticate, duplicateProduct);

// Image ops
// router.post("/:productUuid/images", authenticate, upload.array("images", 10) as any, addProductImages);
// router.delete("/:productUuid/images-delete/:imageUuid", authenticate, deleteProductImage);
// router.patch("/:productUuid/images-update/:imageUuid", authenticate, updateProductImage);
// router.patch("/:productUuid/images/reorder", authenticate, reorderProductImages);

// Bulk
router.patch("/bulk/status", authenticate, bulkUpdateProductStatus);
router.delete("/bulk/delete", authenticate, bulkDeleteProducts);

// Variations
// router.post("/:productUuid/variations", authenticate, createVariation);
// router.put("/:productUuid/variations/:variationUuid", authenticate, updateVariation);
// router.delete("/:productUuid/variations/:variationUuid", authenticate, deleteVariation);

// Variation Options
// router.post("/:productUuid/variations/:variationUuid/options", authenticate, createVariationOption);
// router.put("/:productUuid/variations/:variationUuid/options/:optionUuid", authenticate, updateVariationOption);
// router.delete("/:productUuid/variations/:variationUuid/options/:optionUuid", authenticate, deleteVariationOption);
// router.patch("/:productUuid/variations/:variationUuid/options/reorder", authenticate, reorderVariationOptions);

// Items
// router.post("/:productUuid/items", authenticate, createProductItem);
// router.put("/:productUuid/items/:itemUuid", authenticate, updateProductItem);
// router.delete("/:productUuid/items/:itemUuid", authenticate, deleteProductItem);
// router.put("/:productUuid/items/:itemUuid/configurations", authenticate, setItemConfigurations);
// router.post(
//   "/:productUuid/items/:itemUuid/image",
//   authenticate,
//   upload.single("image") as any,
//   upsertProductItemImage
// );
// router.delete(
//   "/:productUuid/items/:itemUuid/image",
//   authenticate,
//   deleteProductItemImage
// );

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
export default router;
