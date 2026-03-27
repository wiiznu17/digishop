import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { changeRoleService } from '../services/changeRoleService'

export const adminListRoles: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await changeRoleService.listRoles()
    res.json(result)
  }
)

export const adminUpdateAdminRoles: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const requesterRoleSlugs = (req as any)?.roleSlugs || []
    const result = await changeRoleService.updateAdminRoles(
      id,
      req.body,
      requesterRoleSlugs
    )
    res.json(result)
  }
)
