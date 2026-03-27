import { NextFunction, Request, Response } from 'express'
import { NotFoundError } from '../errors/AppError'
import { AuthenticatedRequest } from '../middlewares/middleware'
import { userService } from '../services/userService'
import {
  CreateStoreForUserPayload,
  UpdateMerchantProfileAddressPayload
} from '../types/user.types'
import { asyncHandler } from '../utils/asyncHandler'

export const getMerchantProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await userService.getMerchantProfile({
      userSub: req.user?.sub
    })
    return res.json(result)
  }
)

export const updateMerchantProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await userService.updateMerchantProfile({
      profileDataString: req.body?.profileData as string | undefined,
      files: req.files as Express.Multer.File[] | undefined
    })
    return res.json(result)
  }
)

export const updateMerchantAddress = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await userService.updateMerchantAddress({
      userSub: req.user?.sub,
      addressId: req.params.id,
      payload: req.body as UpdateMerchantProfileAddressPayload
    })

    return res.json(result)
  }
)

export const createStoreForUser: (
  req: Request,
  res: Response,
  next: NextFunction
) => void = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateStoreForUserPayload
  const result = await userService.createStoreForUser(payload)
  return res.status(201).json(result)
})

export const deleteUser: (
  req: Request,
  res: Response,
  next: NextFunction
) => void = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await userService.deleteUser({ id: req.params.id })
  if (!deleted) {
    throw new NotFoundError('User not found')
  }
  return res.status(204).send()
})
