import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { productService } from "../services/productService";

export const searchProduct: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { query, page } = req.query;
  const result = await productService.searchProduct(query as string, page ? Number(page) : undefined);
  res.json(result);
});

export const getProduct: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await productService.getProduct(id);
  res.json(result);
});

export const getAllProduct: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.getAllProducts();
  res.json(result);
});

export const getProductDetail: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  // Stub – original was empty
  res.json({});
});

export const getStoreProduct: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await productService.getStoreProduct(id);
  res.json(result);
});