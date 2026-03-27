import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { productService } from '../services/productService'

export const adminListProducts: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await productService.listProducts(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const adminSuggestProducts: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await productService.suggestProducts(req.query.q as string)
    res.json(result)
  }
)

export const adminGetProductDetail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await productService.getProductDetail(req.params.uuid)
    res.json(result)
  }
)

export const adminModerateProduct: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { reqStatus, rejectReason } = req.body
    const result = await productService.moderateProduct(
      req.params.uuid,
      reqStatus,
      rejectReason
    )
    res.json(result)
  }
)

export const adminBulkModerateProducts: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { productUuids, reqStatus, rejectReason } = req.body
    const result = await productService.bulkModerateProducts(
      productUuids,
      reqStatus,
      rejectReason
    )
    res.json(result)
  }
)

export const adminListCategories: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const mode = (req.query.mode as 'flat' | 'tree') || 'flat'
    const result = await productService.listCategories(mode)
    res.json(result)
  }
)
