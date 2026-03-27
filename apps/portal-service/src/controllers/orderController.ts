import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { orderService } from '../services/orderService'

export const adminSuggestOrders: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await orderService.suggestOrders(req.query.q as string)
    res.json(result)
  }
)

export const adminSuggestCustomerEmails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await orderService.suggestCustomerEmails(
      req.query.q as string
    )
    res.json(result)
  }
)

export const adminSuggestStoreName: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await orderService.suggestStoreName(req.query.q as string)
    res.json(result)
  }
)

export const adminListOrders: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const params = req.query as Record<string, string | undefined>
    const result = await orderService.listOrders(params)
    res.json(result)
  }
)

export const adminGetOrderDetail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const result = await orderService.getOrderDetail(id)
    res.json(result)
  }
)
