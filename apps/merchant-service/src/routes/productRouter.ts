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
} from "../controllers/productController";

const router = Router();

// List & Detail
router.get("/suggest", authenticate, suggestProducts);
router.get("/list", authenticate, getProductList);
router.get("/:productUuid", authenticate, getProductDetail);
router.get("/categories/list", authenticate, listCategories);

// Create / Update / Delete / Duplicate
router.post("/", authenticate, upload.array("images", 10) as any, createProduct);
router.put("/:productUuid", authenticate, upload.array("images", 10) as any, updateProduct);
router.delete("/:productUuid", authenticate, deleteProduct);
router.post("/:productUuid/duplicate", authenticate, duplicateProduct);

// Image ops
router.post("/:productUuid/images", authenticate, upload.array("images", 10) as any, addProductImages);
router.delete("/:productUuid/images/:imageUuid", authenticate, deleteProductImage);
router.patch("/:productUuid/images/:imageUuid", authenticate, updateProductImage);
router.patch("/:productUuid/images/reorder", authenticate, reorderProductImages);

// Bulk
router.patch("/bulk/status", authenticate, bulkUpdateProductStatus);
router.delete("/bulk", authenticate, bulkDeleteProducts);

// Variations
router.post("/:productUuid/variations", authenticate, createVariation);
router.put("/:productUuid/variations/:variationUuid", authenticate, updateVariation);
router.delete("/:productUuid/variations/:variationUuid", authenticate, deleteVariation);

// Variation Options
router.post("/:productUuid/variations/:variationUuid/options", authenticate, createVariationOption);
router.put("/:productUuid/variations/:variationUuid/options/:optionUuid", authenticate, updateVariationOption);
router.delete("/:productUuid/variations/:variationUuid/options/:optionUuid", authenticate, deleteVariationOption);
router.patch("/:productUuid/variations/:variationUuid/options/reorder", authenticate, reorderVariationOptions);

// Items
router.post("/:productUuid/items", authenticate, createProductItem);
router.put("/:productUuid/items/:itemUuid", authenticate, updateProductItem);
router.delete("/:productUuid/items/:itemUuid", authenticate, deleteProductItem);
router.put("/:productUuid/items/:itemUuid/configurations", authenticate, setItemConfigurations);

export default router;


// import { Router } from "express";
// import { authenticate } from "../middlewares/middleware";
// import { upload } from "../middlewares/upload";

// import {
//   // list/detail
//   getProductList,
//   getProductDetail,
//   // product CRUD
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   duplicateProduct,
//   // images
//   addProductImages,
//   deleteProductImage,
//   updateProductImage,
//   reorderProductImages,
//   // bulk
//   bulkUpdateProductStatus,
//   bulkDeleteProducts,
//   // variations
//   createVariation,
//   updateVariation,
//   deleteVariation,
//   createVariationOption,
//   updateVariationOption,
//   deleteVariationOption,
//   reorderVariationOptions,
//   // items
//   createProductItem,
//   updateProductItem,
//   deleteProductItem,
//   setItemConfigurations,
// } from "../controllers/productController";

// import {
//   getProductListValidator,
//   getProductDetailValidator,
//   createProductValidator,
//   updateProductValidator,
//   deleteProductValidator,
//   duplicateProductValidator,
//   addProductImagesValidator,
//   deleteProductImageValidator,
//   updateProductImageValidator,
//   reorderProductImagesValidator,
//   bulkUpdateProductStatusValidator,
//   bulkDeleteProductsValidator,
//   createVariationValidator,
//   updateVariationValidator,
//   deleteVariationValidator,
//   createVariationOptionValidator,
//   updateVariationOptionValidator,
//   deleteVariationOptionValidator,
//   reorderVariationOptionsValidator,
//   createProductItemValidator,
//   updateProductItemValidator,
//   deleteProductItemValidator,
//   setItemConfigurationsValidator,
// } from "../validators/productValidators";

// const router = Router();

// // List & Detail
// router.get("/list", authenticate, getProductListValidator, getProductList);
// router.get("/:productUuid", authenticate, getProductDetailValidator, getProductDetail);

// // Create / Update / Delete / Duplicate
// router.post("/", authenticate, upload.array("images", 10) as any, createProductValidator, createProduct);
// router.put("/:productUuid", authenticate, upload.array("images", 10) as any, updateProductValidator, updateProduct);
// router.delete("/:productUuid", authenticate, deleteProductValidator, deleteProduct);
// router.post("/:productUuid/duplicate", authenticate, duplicateProductValidator, duplicateProduct);

// // Image ops
// router.post("/:productUuid/images", authenticate, upload.array("images", 10) as any, addProductImagesValidator, addProductImages);
// router.delete("/:productUuid/images/:imageUuid", authenticate, deleteProductImageValidator, deleteProductImage);
// router.patch("/:productUuid/images/:imageUuid", authenticate, updateProductImageValidator, updateProductImage);
// router.patch("/:productUuid/images/reorder", authenticate, reorderProductImagesValidator, reorderProductImages);

// // Bulk
// router.patch("/bulk/status", authenticate, bulkUpdateProductStatusValidator, bulkUpdateProductStatus);
// router.delete("/bulk", authenticate, bulkDeleteProductsValidator, bulkDeleteProducts);

// // Variations
// router.post("/:productUuid/variations", authenticate, createVariationValidator, createVariation);
// router.put("/:productUuid/variations/:variationUuid", authenticate, updateVariationValidator, updateVariation);
// router.delete("/:productUuid/variations/:variationUuid", authenticate, deleteVariationValidator, deleteVariation);

// // Variation Options
// router.post("/:productUuid/variations/:variationUuid/options", authenticate, createVariationOptionValidator, createVariationOption);
// router.put("/:productUuid/variations/:variationUuid/options/:optionUuid", authenticate, updateVariationOptionValidator, updateVariationOption);
// router.delete("/:productUuid/variations/:variationUuid/options/:optionUuid", authenticate, deleteVariationOptionValidator, deleteVariationOption);
// router.patch("/:productUuid/variations/:variationUuid/options/reorder", authenticate, reorderVariationOptionsValidator, reorderVariationOptions);

// // Items
// router.post("/:productUuid/items", authenticate, createProductItemValidator, createProductItem);
// router.put("/:productUuid/items/:itemUuid", authenticate, updateProductItemValidator, updateProductItem);
// router.delete("/:productUuid/items/:itemUuid", authenticate, deleteProductItemValidator, deleteProductItem);
// router.put("/:productUuid/items/:itemUuid/configurations", authenticate, setItemConfigurationsValidator, setItemConfigurations);

// export default router;
