import {
  ActorType,
  Order,
  OrderStatus,
  ReturnShipment,
  ReturnShipmentEvent,
  ReturnShipmentStatus,
} from "@digishop/db";
import { CreationAttributes, Transaction } from "sequelize";
import { returnCarrierRepository } from "../repositories/returnCarrierRepository";
import {
  MarkReturnFailedInput,
  ReturnCarrierWebhookInput,
  ReturnCarrierWebhookSuccessResponse,
} from "../types/returnCarrier.types";

export class ReturnCarrierServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? "Return carrier service error"));
    this.name = "ReturnCarrierServiceError";
  }
}

export const RETURN_ALLOW_NEXT: Partial<Record<ReturnShipmentStatus, ReadonlyArray<ReturnShipmentStatus>>> = {
  [ReturnShipmentStatus.AWAITING_DROP]: [
    ReturnShipmentStatus.RETURN_IN_TRANSIT,
    ReturnShipmentStatus.RETURN_TIME_OUT,
  ],
  [ReturnShipmentStatus.RETURN_IN_TRANSIT]: [
    ReturnShipmentStatus.DELIVERED_BACK,
    ReturnShipmentStatus.RETURN_FAILED,
  ],
  [ReturnShipmentStatus.DELIVERED_BACK]: [],
  [ReturnShipmentStatus.RETURN_FAILED]: [],
  [ReturnShipmentStatus.RETURN_TIME_OUT]: [],
};

const canReturnTransition = (from: ReturnShipmentStatus, to: ReturnShipmentStatus) => {
  return RETURN_ALLOW_NEXT[from]?.includes(to) ?? false;
};

export class ReturnCarrierService {
  private async moveOrderStatus(
    order: Order,
    toStatus: OrderStatus,
    transaction: Transaction,
    reason?: string,
  ) {
    const fromStatus = order.status as OrderStatus;
    await returnCarrierRepository.updateOrderStatus(order, toStatus, transaction);
    await returnCarrierRepository.createOrderStatusHistory(
      {
        orderId: order.id,
        fromStatus,
        toStatus,
        changedByType: ActorType.SYSTEM,
        changedById: 0,
        reason: reason ?? null,
        source: "SYSTEM",
        correlationId: null,
        metadata: {},
      },
      transaction,
    );
  }

  async processWebhook(input: ReturnCarrierWebhookInput): Promise<ReturnCarrierWebhookSuccessResponse> {
    const ctx = input.context;
    const {
      carrierCode,
      payload,
      trackingNumber,
      eventTime,
      nextReturnStatus,
      returnShipment,
      isDuplicateEvent,
      orderRecord,
      nextOrderStatus,
      lastEventStatus,
    } = ctx;

    if (isDuplicateEvent) {
      return { ok: true, skipped: "duplicate_event" };
    }

    const shipment = returnShipment as ReturnShipment | undefined;
    const order = orderRecord as Order | undefined;

    if (!shipment) {
      throw new ReturnCarrierServiceError(500, { error: "Return webhook processing failed" });
    }

    await returnCarrierRepository.withTransaction(async (transaction) => {
      await returnCarrierRepository.createReturnShipmentEvent(
        {
          returnShipmentId: shipment.id,
          fromStatus: lastEventStatus as ReturnShipmentStatus,
          toStatus: nextReturnStatus,
          occurredAt: eventTime,
          description:
            (payload as { description?: string | null } | undefined)?.description ?? null,
          location: (payload as { location?: string | null } | undefined)?.location ?? null,
          rawPayload: (payload as object | null | undefined) ?? null,
        } as CreationAttributes<ReturnShipmentEvent>,
        transaction,
      );

      const currentStatus = shipment.status as ReturnShipmentStatus;
      if (canReturnTransition(currentStatus, nextReturnStatus)) {
        const patch: Partial<CreationAttributes<ReturnShipment>> = {
          status: nextReturnStatus,
        };

        if (
          nextReturnStatus === ReturnShipmentStatus.RETURN_IN_TRANSIT &&
          !shipment.trackingNumber
        ) {
          Object.assign(patch, { trackingNumber });
        }

        if (
          nextReturnStatus === ReturnShipmentStatus.DELIVERED_BACK &&
          !shipment.deliveredBackAt
        ) {
          Object.assign(patch, { deliveredBackAt: eventTime });
        }

        if (!shipment.carrier) {
          Object.assign(patch, { carrier: carrierCode });
        }

        await returnCarrierRepository.updateReturnShipment(shipment, patch, transaction);
      }

      if (order && nextOrderStatus) {
        await this.moveOrderStatus(
          order,
          nextOrderStatus,
          transaction,
          `Auto from return carrier (${carrierCode})`,
        );
      }
    });

    return {
      ok: true,
      updateReturnStatus: nextReturnStatus,
      updateOrderStatus: order
        ? ((ctx.nextOrderStatus as OrderStatus) ?? (order.status as OrderStatus))
        : null,
    };
  }

  async markReturnFailed(input: MarkReturnFailedInput) {
    const shipment = await returnCarrierRepository.findReturnShipmentByPk(input.returnShipmentId);
    if (!shipment) {
      throw new ReturnCarrierServiceError(404, { error: "return_shipment_not_found" });
    }

    if (shipment.status !== ReturnShipmentStatus.AWAITING_DROP) {
      throw new ReturnCarrierServiceError(409, { error: "invalid_state" });
    }

    if (!shipment.deadlineDropoffAt || shipment.deadlineDropoffAt > new Date()) {
      throw new ReturnCarrierServiceError(409, { error: "not_due_yet" });
    }

    await returnCarrierRepository.withTransaction(async (transaction) => {
      await returnCarrierRepository.updateReturnShipment(
        shipment,
        { status: ReturnShipmentStatus.RETURN_FAILED },
        transaction,
      );

      await returnCarrierRepository.createReturnShipmentEvent(
        {
          returnShipmentId: shipment.id,
          fromStatus: ReturnShipmentStatus.AWAITING_DROP,
          toStatus: ReturnShipmentStatus.RETURN_FAILED,
          occurredAt: new Date(),
          description: "Auto fail by deadline",
        },
        transaction,
      );

      const order = await returnCarrierRepository.findOrderByPk(shipment.orderId, transaction);
      if (order && order.status === OrderStatus.AWAITING_RETURN) {
        await this.moveOrderStatus(order, OrderStatus.RETURN_FAIL, transaction, "Deadline missed");
      }
    });

    return { ok: true };
  }
}

export const returnCarrierService = new ReturnCarrierService();
