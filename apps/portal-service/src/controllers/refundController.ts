import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { refundService } from '../services/refundService'

export const adminListRefunds: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const params = req.query as Record<string, string | undefined>
    const result = await refundService.listRefunds(params)
    res.json(result)
  }
)
