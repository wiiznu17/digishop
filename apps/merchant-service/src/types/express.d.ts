import type { Store } from "@digishop/db";
import { ShippingStatus, OrderStatus, ReturnShipmentStatus } from "@digishop/db/src/types/enum";

export interface CarrierContext {
  carrierCode: string;
  orderId: number;
  payload: any;
  payloadRaw: string;
  signatureHeader?: string;

  trackingNumber?: string;
  eventTime: Date;
  nextShippingStatus: ShippingStatus;

  shippingInfo?: any;
  lastEventStatus?: ShippingStatus | null;
  isDuplicateEvent?: boolean;

  orderRecord?: any;
  nextOrderStatus?: OrderStatus | null;
}

export interface ReturnCarrierContext {
  carrierCode: string;
  payloadRaw: string;
  signatureHeader?: string;
  payload: any;

  trackingNumber: string;
  eventTime: Date;
  nextReturnStatus: ReturnShipmentStatus;
  returnShipment?: any;
  lastEventStatus?: ReturnShipmentStatus | null;
  isDuplicateEvent?: boolean;
  orderRecord?: any;
  nextOrderStatus?: OrderStatus | null;
}

declare global {
  namespace Express {
    interface Request {
      carrierCtx?: CarrierContext;
      returnCarrierCtx?: ReturnCarrierContext;
      store?: Store;
    }
  }
}

export {};
