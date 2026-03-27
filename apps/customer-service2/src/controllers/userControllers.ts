import { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { userService } from '../services/userService'

export const createAddress: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await userService.createAddress(req.body)
    res.status(200).json({ data: result })
  }
)

export const deleteUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const deleted = await userService.deleteUser(Number(id))
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.status(204).send()
  }
)

export const findaddressUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await userService.findAddressUser(Number(id))
    res.status(200).json({ data: result })
  }
)

export const finduserDetail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await userService.findUserDetail(Number(id))
    res.status(200).json({ data: result })
  }
)

export const updateAddress: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id
    const result = await userService.updateAddress(userId, req.body)
    res.json(result)
  }
)

export const deleteAddress: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id
    const result = await userService.deleteAddress(Number(id))
    res.json(result)
  }
)

export const updateUserName: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id
    const { firstName, lastName, middleName } = req.body
    const result = await userService.updateUserName(Number(id), {
      firstName,
      lastName,
      middleName
    })
    res.json(result)
  }
)

export const refreshTokenAuth: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body
    const result = await userService.refreshTokenAuth(refreshToken)
    res.json(result)
  }
)

export const resetPassword: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { password, token } = req.body
    const result = await userService.resetPassword(token, password)
    res.json(result)
  }
)

export const sendMailResetPassword: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body
    const result = await userService.sendMailResetPassword(email)
    res.json(result)
  }
)

export const sendvaildateEmail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await userService.sendValidateEmail(req.body)
    res.json(result)
  }
)

export const createUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.body
    const result = await userService.createUser(token)
    res.json(result)
  }
)
