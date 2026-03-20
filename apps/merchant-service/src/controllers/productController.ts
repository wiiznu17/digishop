import { Response } from "express";
import { NotFoundError } from "../errors/AppError";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { productService } from "../services/productService";
import { asyncHandler } from "../utils/asyncHandler";

const toQueryString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

const requireStoreId = (req: AuthenticatedRequest, message: string): number => {
  const storeId = req.store?.id;
  if (typeof storeId !== "number") {
    throw new NotFoundError(message);
  }
  return storeId;
};

// GET /merchant/products/suggest?q=...
export const suggestProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");
  const result = await productService.suggestProducts(storeId, toQueryString(req.query.q));
  return res.json(result);
});

// GET /merchant/products/list
export const getProductList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found for this merchant");

  const result = await productService.getProductList(storeId, {
    q: toQueryString(req.query.q),
    categoryUuid: toQueryString(req.query.categoryUuid),
    status: toQueryString(req.query.status),
    reqStatus: toQueryString(req.query.reqStatus),
    sortBy: toQueryString(req.query.sortBy),
    sortDir: toQueryString(req.query.sortDir),
    inStock: toQueryString(req.query.inStock),
    page: toQueryString(req.query.page),
    pageSize: toQueryString(req.query.pageSize),
  });

  return res.json(result);
});

/** GET /merchant/products/:productUuid */
export const getProductDetail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found for this merchant");
  const { productUuid } = req.params as { productUuid: string };
  const product = await productService.getProductDetail(storeId, productUuid);
  return res.json(product);
});

/** GET /merchant/products/categories?flat=true|false (default true) */
export const listCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await productService.listCategories(toQueryString(req.query.flat));
  return res.json(result);
});

/** DELETE /merchant/products/:productUuid */
export const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");
  const { productUuid } = req.params as { productUuid: string };
  await productService.deleteProduct(storeId, productUuid);
  return res.status(204).send();
});

/** PATCH /merchant/products/bulk/status */
export const bulkUpdateProductStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");
  const { productUuids, status } = req.body as { productUuids: string[]; status: string };
  const result = await productService.bulkUpdateProductStatus(storeId, productUuids, status);
  return res.json(result);
});

/** DELETE /merchant/products/bulk */
export const bulkDeleteProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");
  const { productUuids } = req.body as { productUuids: string[] };
  await productService.bulkDeleteProducts(storeId, productUuids);
  return res.status(204).send();
});

/** POST /merchant/products/:productUuid/duplicate */
export const duplicateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");
  const { productUuid } = req.params as { productUuid: string };
  const result = await productService.duplicateProduct(storeId, productUuid);
  return res.status(201).json(result);
});

/** PUT /merchant/products/:productUuid/items/:itemUuid */
export const updateProductItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");
  const { productUuid, itemUuid } = req.params as { productUuid: string; itemUuid: string };
  const { sku, stockQuantity, priceMinor, imageUrl, isEnable } = req.body as {
    sku?: string;
    stockQuantity?: number;
    priceMinor?: number;
    imageUrl?: string | null;
    isEnable?: boolean;
  };

  const result = await productService.updateProductItem(storeId, productUuid, itemUuid, {
    sku,
    stockQuantity,
    priceMinor,
    imageUrl,
    isEnable,
  });

  return res.json(result);
});

// ===== public handlers =====
export const syncCreateDesiredProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");

  const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  const desiredRaw =
    (req.body?.desired as string | undefined) ??
    (req.body?.payload as string | undefined) ??
    (req.body?.productData as string | undefined);

  const result = await productService.applyDesiredState({
    storeId,
    mode: "create",
    desiredRaw,
    files: {
      productImages: files.productImages,
      itemImages: files.itemImages,
    },
  });

  return res.status(result.statusCode).json(result.data);
});

export const syncUpdateDesiredProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const storeId = requireStoreId(req, "No store found");

  const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  const desiredRaw =
    (req.body?.desired as string | undefined) ??
    (req.body?.payload as string | undefined) ??
    (req.body?.productData as string | undefined);

  const result = await productService.applyDesiredState({
    storeId,
    mode: "update",
    productUuid: (req.params as { productUuid: string }).productUuid,
    desiredRaw,
    files: {
      productImages: files.productImages,
      itemImages: files.itemImages,
    },
  });

  return res.status(result.statusCode).json(result.data);
});
