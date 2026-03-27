import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { dashboardService } from '../services/dashboardService'

export const adminDashboardKpis: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await dashboardService.getDashboardKpis(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const adminDashboardSeries: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await dashboardService.getDashboardSeries(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const adminDashboardStatusDist: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await dashboardService.getDashboardStatusDist(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const adminDashboardTopStores: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await dashboardService.getDashboardTopStores(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)
