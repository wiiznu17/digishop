import { ActorType, OrderStatus, PaymentStatus } from "@digishop/db";
import { paymentRepository } from "../repositories/paymentRepository";

export class PaymentService {
  async handleNotify(body: {
    timestamp: any;
    reference: string;
    mid: string;
    payment_type: string;
    order_id: string;
    amount: number;
    currency: string;
    approval_code: string;
    status: string;
    bank_reference: string;
    authorize_token: string;
  }) {
    const findPaymentId = await paymentRepository.findPaymentByProviderRef(body.reference);
    const checkOutId = findPaymentId?.checkoutId;
    const paymentId = findPaymentId?.id;
    const findOrder = checkOutId
      ? await paymentRepository.findOrdersByCheckout(checkOutId)
      : [];

    if (checkOutId) {
      await paymentRepository.updatePayment(checkOutId, {
        pgwStatus: body.status,
        pgwPayload: { status: body.status, checkoutId: checkOutId },
      });
    }

    if (body.status === "APPROVED" && checkOutId && paymentId) {
      await paymentRepository.updateOrdersByCheckout(checkOutId, { status: OrderStatus.PAID });
      await paymentRepository.updatePayment(checkOutId, {
        status: PaymentStatus.SUCCESS,
        paidAt: body.timestamp,
      });

      for (const order of findOrder) {
        await paymentRepository.createOrderStatusHistory({
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          changedByType: ActorType.SYSTEM,
          source: "API",
          metadata: {},
        });
      }

      await paymentRepository.createPaymentGatewayEvent({
        checkoutId: checkOutId,
        paymentId,
        type: "NOTIFY",
        amountMinor: body.amount * 100,
        provider: "DIGIPAY",
        status: "SUCCESS",
        reqJson: body,
        resJson: {},
      });
    }

    if (body.status === "CANCELED" && checkOutId && paymentId) {
      await paymentRepository.updateOrdersByCheckout(checkOutId, { status: OrderStatus.CUSTOMER_CANCELED });
      await paymentRepository.updatePayment(checkOutId, { status: PaymentStatus.FAILED });

      for (const order of findOrder) {
        await paymentRepository.createOrderStatusHistory({
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CUSTOMER_CANCELED,
          changedByType: ActorType.SYSTEM,
          source: "API",
          metadata: {},
        });
      }

      await paymentRepository.createPaymentGatewayEvent({
        checkoutId: checkOutId,
        paymentId,
        type: "NOTIFY",
        amountMinor: body.amount * 100,
        provider: "DIGIPAY",
        status: "CANCELED",
        reqJson: body,
        resJson: {},
      });
    }

    if (body.status === "FAILED" && checkOutId && paymentId) {
      await paymentRepository.updateOrdersByCheckout(checkOutId, { status: OrderStatus.CUSTOMER_CANCELED });
      await paymentRepository.updatePayment(checkOutId, { status: PaymentStatus.FAILED });

      for (const order of findOrder) {
        await paymentRepository.createOrderStatusHistory({
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CUSTOMER_CANCELED,
          changedByType: ActorType.SYSTEM,
          source: "API",
          metadata: {},
        });
      }

      await paymentRepository.createPaymentGatewayEvent({
        checkoutId: checkOutId,
        paymentId,
        type: "NOTIFY",
        amountMinor: body.amount * 100,
        provider: "DIGIPAY",
        status: "FAILED",
        reqJson: body,
        resJson: {},
      });
    }
  }

  async getCallbackRedirectUrl(
    reference: string,
    process_status: string
  ): Promise<{ url: string }> {
    const findPaymentId = await paymentRepository.findPaymentByProviderRef(reference);
    if (!findPaymentId) return { url: process.env.WEBSITE_CUSTOMER_URL || "" };

    const checkoutId = findPaymentId.checkoutId;
    const orderCode = await paymentRepository.findCheckoutById(checkoutId);
    const linkResult = `${process.env.WEBSITE_CUSTOMER_URL}/order/${orderCode?.get("orderCode")}`;
    const link = process.env.WEBSITE_CUSTOMER_URL || "";

    if (process_status === "true") {
      return { url: linkResult };
    } else if (process_status === "false") {
      return { url: linkResult };
    }
    return { url: link };
  }
}

export const paymentService = new PaymentService();
