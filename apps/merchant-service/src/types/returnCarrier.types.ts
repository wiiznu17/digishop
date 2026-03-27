import { OrderStatus, ReturnShipmentStatus } from '@digishop/db'
import { ReturnCarrierContext } from './express'

export type ReturnCarrierWebhookInput = {
  context: ReturnCarrierContext
}

export type ReturnCarrierWebhookSuccessResponse = {
  ok: true
  skipped?: 'duplicate_event'
  updateReturnStatus?: ReturnShipmentStatus
  updateOrderStatus?: OrderStatus | null
}

export type MarkReturnFailedInput = {
  returnShipmentId: number
}
