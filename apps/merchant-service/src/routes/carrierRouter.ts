// import { Router } from "express";
import express from "express"
import { carrierWebhook } from "../controllers/carrierController";
import {
  cmwParseBase,
  cmwVerifySignature,
  cmwExtractCoreFields,
  cmwLoadShippingInfo,
  cmwDeduplicateEvent,
  cmwComputeOrderTransition,
} from "../middlewares/carrierMiddleware";

const router: express.Router = express.Router();

// Validate → Enrich → Handle
router.post(
  "/webhooks/carriers/:carrier",
  cmwParseBase,              // set carrierCtx (carrierCode, payload, payloadRaw, signatureHeader)
  cmwVerifySignature,        // verify HMAC if configured
  cmwExtractCoreFields,      // get trackingNumber, eventTime, nextShippingStatus
  cmwLoadShippingInfo,       // find ShippingInfo (202 if not found)
  cmwDeduplicateEvent,       // skip near-duplicate events
  cmwComputeOrderTransition, // load Order & compute nextOrderStatus
  carrierWebhook             // write events + update order
);

export default router;
