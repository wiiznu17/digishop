import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { categoryService } from "../services/categoryService";

type ListQuery = {
  parentUuid?: string;
  q?: string;
  page?: string;
  pageSize?: string;
  mode?: "flat";
};

export const listCategories: RequestHandler<{}, any, any, ListQuery> = asyncHandler(async (req: Request<{}, {}, {}, ListQuery>, res: Response) => {
  const result = await categoryService.listCategories(req.query);
  res.json(result);
});

export const suggestCategories: RequestHandler<{}, any, any, { q?: string }> = asyncHandler(async (req: Request<{}, {}, {}, { q?: string }>, res: Response) => {
  const result = await categoryService.suggestCategories(req.query.q as string);
  res.json(result);
});

export const getCategoryDetail: RequestHandler<{ uuid: string }> = asyncHandler(async (req: Request<{ uuid: string }>, res: Response) => {
  const result = await categoryService.getCategoryDetail(req.params.uuid);
  res.json(result);
});

export const createCategory: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req.body);
  res.status(201).json(result);
});

export const updateCategory: RequestHandler<{ uuid: string }> = asyncHandler(async (req: Request<{ uuid: string }>, res: Response) => {
  const result = await categoryService.updateCategory(req.params.uuid, req.body);
  res.json(result);
});

export const deleteCategory: RequestHandler<{ uuid: string }> = asyncHandler(async (req: Request<{ uuid: string }>, res: Response) => {
  try {
    const result = await categoryService.deleteCategory(req.params.uuid);
    res.json(result);
  } catch (e: any) {
    if (e.message && e.message.startsWith("CATEGORY_HAS_PRODUCTS")) {
      res.status(409).json({ error: "CATEGORY_HAS_PRODUCTS" }); // Emulate previous return for 409
    } else {
      throw e;
    }
  }
});

export const moveProducts: RequestHandler<{ uuid: string }> = asyncHandler(async (req: Request<{ uuid: string }>, res: Response) => {
  const result = await categoryService.moveProducts(req.params.uuid, req.body.targetCategoryUuid);
  res.json(result);
});
