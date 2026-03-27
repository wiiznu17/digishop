import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { analyticsService } from '../services/analyticsService'

export const anaKpis: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await analyticsService.getKpis(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const anaTrends: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await analyticsService.getTrends(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const anaStatusDist: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await analyticsService.getStatusDist(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const anaStoreLeaderboard: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await analyticsService.getStoreLeaderboard(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)
