import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { storeService } from '../services/storeService'

export const adminListStores: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const params = req.query as Record<string, string | undefined>
    const result = await storeService.listStores(params)
    res.json(result)
  }
)

export const adminSuggestStores: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await storeService.suggestStores(req.query.q as string)
    res.json(result)
  }
)

export const adminGetStoreDetail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const result = await storeService.getStoreDetail(id)
    res.json(result)
  }
)

export const adminApproveStore: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const result = await storeService.approveStore(id)
    res.status(200).json(result)
  }
)
