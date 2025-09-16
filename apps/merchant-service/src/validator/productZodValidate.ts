import { z } from "zod";
import { validate } from "./validate";
import { ProductStatus } from "@digishop/db/src/types/enum";

/** ---------- Common primitives ---------- */
const uuid36 = z.string().uuid("invalid uuid");
const nonEmptyStr = z.string().trim().min(1);
const urlStr = z.string().url().optional().or(z.literal(null));

/** ---------- Product list / detail ---------- */
const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  categoryUuid: uuid36.optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "price"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const getProductListValidator = validate({ query: listQuerySchema });

const productParamSchema = z.object({ productUuid: uuid36 });
export const getProductDetailValidator = validate({ params: productParamSchema });

/** ---------- Product create/update (multipart: productData เป็น JSON string) ---------- */
// ตัวตรวจ productData (ไม่เปลี่ยน req.body เดิม — แค่ validate)
const productUpsertSchema = z.object({
  // ใช้ categoryId ตามที่ backend ใช้อยู่
  categoryId: z.number({ invalid_type_error: "categoryId must be a number" })
    .int().positive(),
  name: nonEmptyStr,
  description: z.string().nullable().optional(),
  // base price ที่ product (ถ้าใช้) อนุญาตให้ null/ไม่ส่ง
  price: z.number().int().nonnegative().nullable().optional(),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

const productDataJsonString = z.string().superRefine((val, ctx) => {
  try {
    const obj = JSON.parse(val);
    const parsed = productUpsertSchema.safeParse(obj);
    if (!parsed.success) {
      parsed.error.issues.forEach(issue =>
        ctx.addIssue({
          code: issue.code,
          path: ["productData", ...(issue.path ?? [])],
          message: issue.message,
        })
      );
    }
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "productData must be valid JSON" });
  }
});

export const createProductValidator = validate({
  body: z.object({ productData: productDataJsonString }),
});

export const updateProductValidator = validate({
  params: productParamSchema,
  body: z.object({ productData: productDataJsonString }),
});

/** ---------- Delete / Duplicate ---------- */
export const deleteProductValidator = validate({ params: productParamSchema });
export const duplicateProductValidator = validate({ params: productParamSchema });

/** ---------- Image ops ---------- */
const imageParamSchema = z.object({
  productUuid: uuid36,
  imageUuid: uuid36,
});

export const addProductImagesValidator = validate({
  params: productParamSchema,
  // ไม่มี body (ไฟล์แนบ) — แต่ถ้าต้องการบังคับ ต้องเช็คใน middleware อัปโหลดไฟล์แทน
});

export const deleteProductImageValidator = validate({ params: imageParamSchema });

const updateImageBody = z.object({
  isMain: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
}).refine(v => v.isMain !== undefined || v.sortOrder !== undefined, {
  message: "At least one of isMain or sortOrder is required",
});

export const updateProductImageValidator = validate({
  params: imageParamSchema,
  body: updateImageBody,
});

export const reorderProductImagesValidator = validate({
  params: productParamSchema,
  body: z.object({
    orders: z.array(
      z.object({
        imageUuid: uuid36,
        sortOrder: z.coerce.number().int().min(0),
      })
    ).min(1, "orders must contain at least 1 item"),
  }),
});

/** ---------- Bulk ---------- */
export const bulkUpdateProductStatusValidator = validate({
  body: z.object({
    productUuids: z.array(uuid36).min(1),
    status: z.nativeEnum(ProductStatus),
  }),
});

export const bulkDeleteProductsValidator = validate({
  body: z.object({
    productUuids: z.array(uuid36).min(1),
  }),
});

/** ---------- Variations ---------- */
const variationParamSchema = z.object({
  productUuid: uuid36,
  variationUuid: uuid36,
});

export const createVariationValidator = validate({
  params: productParamSchema,
  body: z.object({ name: nonEmptyStr }),
});

export const updateVariationValidator = validate({
  params: variationParamSchema,
  body: z.object({ name: nonEmptyStr }),
});

export const deleteVariationValidator = validate({ params: variationParamSchema });

/** ---------- Variation Options ---------- */
const optionParamSchema = z.object({
  productUuid: uuid36,
  variationUuid: uuid36,
  optionUuid: uuid36,
});

export const createVariationOptionValidator = validate({
  params: variationParamSchema,
  body: z.object({
    value: nonEmptyStr,
    sortOrder: z.coerce.number().int().min(0).optional(),
  }),
});

export const updateVariationOptionValidator = validate({
  params: optionParamSchema,
  body: z.object({
    value: z.string().trim().min(1).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  }).refine(v => v.value !== undefined || v.sortOrder !== undefined, {
    message: "At least one of value or sortOrder is required",
  }),
});

export const deleteVariationOptionValidator = validate({ params: optionParamSchema });

export const reorderVariationOptionsValidator = validate({
  params: variationParamSchema,
  body: z.object({
    orders: z.array(
      z.object({
        optionUuid: uuid36,
        sortOrder: z.coerce.number().int().min(0),
      })
    ).min(1),
  }),
});

/** ---------- Items ---------- */
const itemParamSchema = z.object({
  productUuid: uuid36,
  itemUuid: uuid36,
});

export const createProductItemValidator = validate({
  params: productParamSchema,
  body: z.object({
    sku: z.string().trim().min(1).optional(),       // controller มี safety net auto gen
    stockQuantity: z.coerce.number().int().min(0).optional(),
    priceMinor: z.coerce.number().int().min(0),
    imageUrl: urlStr,
  }),
});

export const updateProductItemValidator = validate({
  params: itemParamSchema,
  body: z.object({
    sku: z.string().trim().min(1).optional(),
    stockQuantity: z.coerce.number().int().min(0).optional(),
    priceMinor: z.coerce.number().int().min(0).optional(),
    imageUrl: urlStr,
  }).refine(v => Object.values(v).some(x => x !== undefined), {
    message: "At least one field is required",
  }),
});

export const deleteProductItemValidator = validate({ params: itemParamSchema });

export const setItemConfigurationsValidator = validate({
  params: itemParamSchema,
  body: z.object({
    optionUuids: z.array(uuid36).default([]),
  }),
});
