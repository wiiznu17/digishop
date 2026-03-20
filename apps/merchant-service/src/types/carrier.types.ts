import { OrderStatus, ShippingStatus } from "@digishop/db";
import { CarrierContext } from "./express";

export type CarrierWebhookInput = {
  context: CarrierContext;
};

export type CarrierWebhookSuccessResponse = {
  ok: true;
  skipped?: "duplicate_event";
  updateShippingStatus?: ShippingStatus;
  shippingAutoChained?: ShippingStatus | null;
  updateOrderStatus?: OrderStatus | null;
  orderAutoChained?: { from: OrderStatus; to: OrderStatus } | null;
};
