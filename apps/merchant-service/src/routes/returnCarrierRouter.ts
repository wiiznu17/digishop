import express from 'express'
import {
  rcmwParseBase,
  rcmwVerifySignature,
  rcmwExtractCoreFields,
  rcmwLoadReturnShipment,
  rcmwDeduplicateEvent,
  rcmwComputeOrderTransition
} from '../middlewares/returnCarrierMiddleware'

import {
  returnCarrierWebhook,
  markReturnFailed
} from '../controllers/returnCarrierController'

const router: express.Router = express.Router()

// webhook ขนส่ง “ขากลับ”
router.post(
  '/webhooks/returns/:carrier',
  rcmwParseBase,
  rcmwVerifySignature,
  rcmwExtractCoreFields,
  rcmwLoadReturnShipment,
  rcmwDeduplicateEvent,
  rcmwComputeOrderTransition,
  returnCarrierWebhook
)

// worker/cron: auto-timeout
router.post('/returns/:id/fail', markReturnFailed)

export default router
