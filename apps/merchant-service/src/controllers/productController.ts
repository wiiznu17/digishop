import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { productService, ProductServiceError } from "../services/productService";

const toQueryString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

const getStoreId = (req: AuthenticatedRequest): number | null => {
  const storeId = req.store?.id;
  return typeof storeId === "number" ? storeId : null;
};

const handleControllerError = (res: Response, label: string, error: unknown) => {
  if (error instanceof ProductServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(`${label} error:`, error);
  return res.status(500).json({ error: "Internal server error" });
};

// GET /merchant/products/suggest?q=...
export const suggestProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

    const result = await productService.suggestProducts(storeId, toQueryString(req.query.q));
    return res.json(result);
  } catch (error) {
    return handleControllerError(res, "suggestProducts", error);
  }
};

// GET /merchant/products/list
export const getProductList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found for this merchant" });

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
  } catch (error) {
    return handleControllerError(res, "getProductList", error);
  }
};

/** GET /merchant/products/:productUuid */
export const getProductDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found for this merchant" });

    const { productUuid } = req.params as { productUuid: string };
    const product = await productService.getProductDetail(storeId, productUuid);
    return res.json(product);
  } catch (error) {
    return handleControllerError(res, "getProductDetail", error);
  }
};

/** GET /merchant/products/categories?flat=true|false (default true) */
export const listCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await productService.listCategories(toQueryString(req.query.flat));
    return res.json(result);
  } catch (error) {
    return handleControllerError(res, "listCategories", error);
  }
};

/** DELETE /merchant/products/:productUuid */
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

    const { productUuid } = req.params as { productUuid: string };
    await productService.deleteProduct(storeId, productUuid);
    return res.status(204).send();
  } catch (error) {
    return handleControllerError(res, "deleteProduct", error);
  }
};

/** PATCH /merchant/products/bulk/status */
export const bulkUpdateProductStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

    const { productUuids, status } = req.body as { productUuids: string[]; status: string };
    const result = await productService.bulkUpdateProductStatus(storeId, productUuids, status);
    return res.json(result);
  } catch (error) {
    return handleControllerError(res, "bulkUpdateProductStatus", error);
  }
};

/** DELETE /merchant/products/bulk */
export const bulkDeleteProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

    const { productUuids } = req.body as { productUuids: string[] };
    await productService.bulkDeleteProducts(storeId, productUuids);
    return res.status(204).send();
  } catch (error) {
    return handleControllerError(res, "bulkDeleteProducts", error);
  }
};

/** POST /merchant/products/:productUuid/duplicate */
export const duplicateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

    const { productUuid } = req.params as { productUuid: string };
    const result = await productService.duplicateProduct(storeId, productUuid);
    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(res, "duplicateProduct", error);
  }
};

/** PUT /merchant/products/:productUuid/items/:itemUuid */
export const updateProductItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

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
  } catch (error) {
    return handleControllerError(res, "updateProductItem", error);
  }
};

// ===== public handlers =====
export const syncCreateDesiredProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

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
  } catch (error) {
    return handleControllerError(res, "syncCreateDesiredProduct", error);
  }
};

export const syncUpdateDesiredProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(404).json({ error: "No store found" });

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
  } catch (error) {
    return handleControllerError(res, "syncUpdateDesiredProduct", error);
  }
};
