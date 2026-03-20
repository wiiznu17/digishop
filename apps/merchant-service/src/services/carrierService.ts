import { ActorType, Order, OrderStatus, ShippingInfo, ShippingStatus } from "@digishop/db";
import { CreationAttributes, Transaction } from "sequelize";
import { carrierRepository } from "../repositories/carrierRepository";
import { CarrierWebhookInput, CarrierWebhookSuccessResponse } from "../types/carrier.types";

export class CarrierServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? "Carrier service error"));
    this.name = "CarrierServiceError";
  }
}

const SHIP_ALLOW_NEXT: Partial<Record<ShippingStatus, ReadonlyArray<ShippingStatus>>> = {
  [ShippingStatus.READY_TO_SHIP]: [ShippingStatus.RECEIVE_PARCEL],
  [ShippingStatus.RECEIVE_PARCEL]: [ShippingStatus.ARRIVED_SORTING_CENTER],
  [ShippingStatus.ARRIVED_SORTING_CENTER]: [ShippingStatus.OUT_SORTING_CENTER],
  [ShippingStatus.OUT_SORTING_CENTER]: [ShippingStatus.ARRIVED_DESTINATION_STATION],
  [ShippingStatus.ARRIVED_DESTINATION_STATION]: [ShippingStatus.OUT_FOR_DELIVERY],
  [ShippingStatus.OUT_FOR_DELIVERY]: [
    ShippingStatus.DELIVERED,
    ShippingStatus.DELIVERY_FAILED,
    ShippingStatus.TRANSIT_ISSUE,
  ],
  [ShippingStatus.DELIVERED]: [],
  [ShippingStatus.DELIVERY_FAILED]: [ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT],
  [ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT]: [ShippingStatus.RETURNED_TO_SENDER],
  [ShippingStatus.RETURNED_TO_SENDER]: [],
  [ShippingStatus.TRANSIT_ISSUE]: [
    ShippingStatus.RE_TRANSIT,
    ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT,
  ],
  [ShippingStatus.RE_TRANSIT]: [ShippingStatus.OUT_FOR_DELIVERY],
};

const ORDER_ALLOW_NEXT: Partial<Record<OrderStatus, ReadonlyArray<OrderStatus>>> = {
  [OrderStatus.READY_TO_SHIP]: [OrderStatus.HANDED_OVER],
  [OrderStatus.HANDED_OVER]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.TRANSIT_LACK],
  [OrderStatus.TRANSIT_LACK]: [OrderStatus.RE_TRANSIT],
  [OrderStatus.RE_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.TRANSIT_LACK],
  [OrderStatus.AWAITING_RETURN]: [OrderStatus.RECEIVE_RETURN],
};

const canShipTransition = (from: ShippingStatus | null, to: ShippingStatus): boolean => {
  if (from === null) return true;
  const allowed = SHIP_ALLOW_NEXT[from];
  if (!allowed) return true;
  return allowed.includes(to);
};

const canOrderTransition = (from: OrderStatus, to: OrderStatus): boolean => {
  const allowed = ORDER_ALLOW_NEXT[from];
  if (!allowed) return true;
  return allowed.includes(to);
};

export class CarrierService {
  private async moveOrderStatus(
    orderRecord: Order,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    transaction: Transaction,
    changedBy: ActorType,
    reason?: string,
  ) {
    if (!canOrderTransition(fromStatus, toStatus)) {
      throw new Error(`[order] illegal transition ${fromStatus} -> ${toStatus}`);
    }

    await carrierRepository.updateOrderStatus(orderRecord, toStatus, transaction);
    await carrierRepository.createOrderStatusHistory(
      {
        orderId: orderRecord.id,
        fromStatus,
        toStatus,
        changedByType: changedBy,
        changedById: 0,
        reason: reason ?? null,
        source: "SYSTEM",
        correlationId: null,
        metadata: {},
      },
      transaction,
    );
  }

  async processWebhook(input: CarrierWebhookInput): Promise<CarrierWebhookSuccessResponse> {
    const ctx = input.context;
    const {
      shippingInfo,
      nextShippingStatus,
      eventTime,
      payload,
      carrierCode,
      isDuplicateEvent,
      orderRecord,
      nextOrderStatus,
      lastEventStatus,
    } = ctx;

    if (isDuplicateEvent) {
      return { ok: true, skipped: "duplicate_event" };
    }

    const shipping = shippingInfo as ShippingInfo | undefined;
    const order = orderRecord as Order | undefined;

    if (!shipping) {
      throw new CarrierServiceError(500, { error: "Webhook processing failed" });
    }

    const fromShip: ShippingStatus | null = (lastEventStatus as ShippingStatus | undefined) ?? shipping.shippingStatus ?? null;

    if (!canShipTransition(fromShip, nextShippingStatus)) {
      throw new CarrierServiceError(409, {
        ok: false,
        error: "illegal_shipping_transition",
        from: fromShip,
        to: nextShippingStatus,
      });
    }

    if (order && nextOrderStatus) {
      const fromOrder = order.status as OrderStatus;
      if (!canOrderTransition(fromOrder, nextOrderStatus)) {
        throw new CarrierServiceError(409, {
          ok: false,
          error: "illegal_order_transition",
          from: fromOrder,
          to: nextOrderStatus,
        });
      }
    }

    let shippingAutoChained: ShippingStatus | null = null;
    let orderAutoChained: { from: OrderStatus; to: OrderStatus } | null = null;

    await carrierRepository.withTransaction(async (transaction) => {
      await carrierRepository.createShipmentEvent(
        {
          shippingInfoId: shipping.id,
          fromStatus: fromShip,
          toStatus: nextShippingStatus,
          description: payload.description || payload.status_text || payload.message || null,
          location: payload.location || payload.facility || null,
          rawPayload: payload,
          occurredAt: eventTime,
        },
        transaction,
      );

      const shippingPatch: Partial<CreationAttributes<ShippingInfo>> = {
        shippingStatus: nextShippingStatus,
      };
      if (nextShippingStatus === ShippingStatus.DELIVERED && !shipping.deliveredAt) {
        Object.assign(shippingPatch, { deliveredAt: eventTime });
      }
      if (
        nextShippingStatus === ShippingStatus.RETURNED_TO_SENDER &&
        !shipping.returnedToSenderAt
      ) {
        Object.assign(shippingPatch, { returnedToSenderAt: eventTime });
      }
      await carrierRepository.updateShippingInfo(
        shipping,
        shippingPatch,
        transaction,
      );

      if (nextShippingStatus === ShippingStatus.TRANSIT_ISSUE) {
        const outForDeliveryCount = await carrierRepository.countShipmentEventsByToStatus(
          shipping.id,
          ShippingStatus.OUT_FOR_DELIVERY,
          transaction,
        );

        if (
          outForDeliveryCount >= 3 &&
          shipping.shippingStatus !== ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT
        ) {
          if (
            canShipTransition(
              ShippingStatus.TRANSIT_ISSUE,
              ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT,
            )
          ) {
            await carrierRepository.createShipmentEvent(
              {
                shippingInfoId: shipping.id,
                fromStatus: ShippingStatus.TRANSIT_ISSUE,
                toStatus: ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT,
                description: "Auto transition after 3 OUT_FOR_DELIVERY attempts",
                location: null,
                rawPayload: { autoChained: true, carrierCode },
                occurredAt: eventTime,
              },
              transaction,
            );

            await carrierRepository.updateShippingInfo(
              shipping,
              { shippingStatus: ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT },
              transaction,
            );

            shippingAutoChained = ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT;
          }
        }
      }

      if (order && nextOrderStatus) {
        const currentOrderStatus = order.status as OrderStatus;

        if (nextOrderStatus === OrderStatus.TRANSIT_LACK) {
          const shippedCount = await carrierRepository.countOrderStatusHistoryByToStatus(
            order.id,
            OrderStatus.SHIPPED,
            transaction,
          );

          if (shippedCount >= 3) {
            await this.moveOrderStatus(
              order,
              currentOrderStatus,
              OrderStatus.TRANSIT_LACK,
              transaction,
              ActorType.SYSTEM,
              `Auto set TRANSIT_LACK from carrier ${carrierCode} (TRANSIT_ISSUE)`,
            );

            if (canOrderTransition(OrderStatus.TRANSIT_LACK, OrderStatus.AWAITING_RETURN)) {
              await this.moveOrderStatus(
                order,
                OrderStatus.TRANSIT_LACK,
                OrderStatus.AWAITING_RETURN,
                transaction,
                ActorType.SYSTEM,
                "Auto escalate to AWAITING_RETURN after 3 SHIPPED occurrences",
              );

              orderAutoChained = {
                from: OrderStatus.TRANSIT_LACK,
                to: OrderStatus.AWAITING_RETURN,
              };
            }
          } else {
            await this.moveOrderStatus(
              order,
              currentOrderStatus,
              nextOrderStatus,
              transaction,
              ActorType.SYSTEM,
              `Auto transition from carrier ${carrierCode}`,
            );
          }
        } else {
          await this.moveOrderStatus(
            order,
            currentOrderStatus,
            nextOrderStatus,
            transaction,
            ActorType.SYSTEM,
            `Auto transition from carrier ${carrierCode}`,
          );
        }
      }
    });

    return {
      ok: true,
      updateShippingStatus: nextShippingStatus,
      shippingAutoChained,
      updateOrderStatus: order
        ? ((ctx.nextOrderStatus as OrderStatus) ?? (order.status as OrderStatus))
        : null,
      orderAutoChained,
    };
  }
}

export const carrierService = new CarrierService();
