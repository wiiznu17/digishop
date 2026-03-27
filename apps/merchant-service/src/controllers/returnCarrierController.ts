import { NextFunction, Request, Response } from 'express'
import { ReturnCarrierContext } from '../types/express'
import { returnCarrierService } from '../services/returnCarrierService'
import { asyncHandler } from '../utils/asyncHandler'

export const returnCarrierWebhook: (
  req: Request,
  res: Response,
  next: NextFunction
) => void = asyncHandler(async (req: Request, res: Response) => {
  const ctx = req.returnCarrierCtx as ReturnCarrierContext
  const result = await returnCarrierService.processWebhook({ context: ctx })
  return res.json(result)
})

export const markReturnFailed: (
  req: Request,
  res: Response,
  next: NextFunction
) => void = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const result = await returnCarrierService.markReturnFailed({
    returnShipmentId: id
  })
  return res.json(result)
})
