import { CheckOut, Order, OrderStatusHistory, Payment, PaymentGatewayEvent } from "@digishop/db";

export class PaymentRepository {
  async findPaymentByProviderRef(reference: string) {
    return Payment.findOne({
      where: { providerRef: reference },
      attributes: ["id", "checkoutId"],
    });
  }

  async findOrdersByCheckout(checkoutId: number) {
    return Order.findAll({
      where: { checkoutId },
      attributes: ["id"],
    });
  }

  async updatePayment(checkoutId: number, payload: any) {
    return Payment.update(payload, { where: { checkoutId } });
  }

  async updateOrdersByCheckout(checkoutId: number, payload: any) {
    return Order.update(payload, { where: { checkoutId } });
  }

  async createOrderStatusHistory(payload: any) {
    const log = await OrderStatusHistory.create(payload);
    await log.save();
    return log;
  }

  async createPaymentGatewayEvent(payload: any) {
    return PaymentGatewayEvent.create(payload);
  }

  async findCheckoutById(id: number) {
    return CheckOut.findOne({ where: { id }, attributes: ["orderCode"] });
  }
}

export const paymentRepository = new PaymentRepository();
