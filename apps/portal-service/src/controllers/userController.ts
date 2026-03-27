import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { userService } from '../services/userService'

export const adminListUsers: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await userService.listUsers(
      req.query as Record<string, string | undefined>
    )
    res.json(result)
  }
)

export const adminSuggestUsers: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await userService.suggestUsers(req.query.q as string)
    res.json(result)
  }
)

export const adminGetUserDetail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const result = await userService.getUserDetail(id)
    res.json(result)
  }
)
