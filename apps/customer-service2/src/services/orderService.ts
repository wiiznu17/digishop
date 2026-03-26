import axios from "axios";
import crypto from "crypto";
import { addDays, differenceInDays } from "date-fns";
import { sequelize, ActorType, OrderStatus, OrderPolicy, PaymentMethod, PaymentStatus, RefundStatus, ShippingStatus } from "@digishop/db";
import { AppError, BadRequestError, NotFoundError } from "../errors/AppError";
import { orderRepository } from "../repositories/orderRepository";
import { enqueueAutoCancel } from "../queues/cancelQueue";
import { enqueueRefundAutoApprove } from "../queues/refundQueue";

const signKey = process.env.MERCHANRT_SIGN_KEY || "";
const midCard = process.env.MERCHANRT_MID_CARD || "";
const midQR30 = process.env.MERCHANRT_MID_QR30 || "";
const apiId = process.env.MERCHANRT_API_ID || "";
const apiKey = process.env.MERCHANRT_API_KEY || "";
const partnerId = process.env.MERCHANRT_PARTNER_ID || "";

const contentSignature = (body: object) => {
  const hmac = crypto.createHmac("sha256", Buffer.from(String(signKey.toString()), "base64"));
  return hmac.update(JSON.stringify(body)).digest("base64");
};

export class OrderService {
  async findOrder(id: string, userId: string) {
    return orderRepository.findOrderByCodeAndUser(id, userId);
  }

  async findUserOrder(userId: string) {
    const result = await orderRepository.findUserOrders(userId);
    return { body: result.rows, count: result.count };
  }

  async findUserCart(userId: string) {
    const cartId = await orderRepository.findCart(userId);
    if (!cartId) return null;
    const shoppingCartData = await orderRepository.findCartItems(cartId.id);
    return { data: shoppingCartData.rows, count: shoppingCartData.count };
  }

  async deleteCart(items: number[]) {
    for (const id of items) {
      await orderRepository.destroyCartItem(id);
    }
    return { message: `del ${items}` };
  }

  async createOrderId(customerId: string, orderData: any[]) {
    const user = await orderRepository.findUserById(customerId);
    if (!user) throw new NotFoundError("User not found");

    const groupStoreId = orderData.reduce((acc: any, item: any) => {
      const key = item.productItem.product.storeId;
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    if (Object.keys(groupStoreId).length > 1) throw new BadRequestError("Order more than one store");

    const orderCod = "DGS" + Date.now() + customerId;
    const checkoutId = await orderRepository.createCheckout(customerId, orderCod);

    const sumprice = (data: any[]) => {
      if (!data) return 0;
      let sum = 0;
      for (const item of data) sum += item.lineTotalMinor;
      return sum;
    };

    for (const [key, values] of Object.entries(groupStoreId) as [string, any[]][]) {
      const orderRecord = await orderRepository.createOrder({
        checkoutId: checkoutId.id,
        reference: orderCod + key,
        subtotalMinor: sumprice(values),
        shippingFeeMinor: 0,
        taxTotalMinor: 0,
        discountTotalMinor: 0,
        grandTotalMinor: 0,
        currencyCode: "",
        status: OrderStatus.PENDING,
        customerNameSnapshot: (user as any).firstName,
        customerEmailSnapshot: (user as any).email,
        storeNameSnapshot: "",
        storeId: Number(key),
      });

      for (const item of values) {
        await orderRepository.createOrderItem({
          orderId: orderRecord.id,
          productId: item.productItem.productId,
          productItemId: item.productItemId,
          quantity: item.quantity,
          unitPriceMinor: item.productItem.priceMinor,
          discountMinor: 0,
          taxRate: "0.0000",
          productNameSnapshot: item.productItem.product.name,
          productSkuSnapshot: item.productItem.sku,
          productImageSnapshot: "",
        });
      }
    }

    return { data: orderCod };
  }

  async createOrder(payload: {
    orderCode: string;
    customerId: string;
    paymentMethod: string;
    shippingTypeId: number;
    shippingAddress: any;
    productprice: number;
    shippingfee: number;
    orderNote?: string;
  }) {
    const { orderCode, customerId, paymentMethod, shippingTypeId, shippingAddress, productprice, shippingfee, orderNote } = payload;
    const user = await orderRepository.findUserById(customerId);
    const checkoutId = await orderRepository.findCheckoutByOrderCode(orderCode);
    if (!user || !checkoutId) throw new BadRequestError("User or CheckOut not found");

    const taxTotalMinor = 0;
    const discountTotalMinor = 0;

    const orderId = await orderRepository.findOrdersByCheckout(checkoutId.id);
    const grandTotalMinor = productprice + shippingfee * orderId.length + taxTotalMinor - discountTotalMinor;

    for (const ord of orderId) {
      await orderRepository.updateOrder(ord.id, {
        shippingFeeMinor: shippingfee,
        taxTotalMinor,
        discountTotalMinor,
        currencyCode: "THB",
        orderNote,
        grandTotalMinor: shippingfee + ord.subtotalMinor + taxTotalMinor - discountTotalMinor,
      });
      await orderRepository.createShippingInfo({
        orderId: ord.id,
        shippingTypeId,
        shippingAddress,
        shippingStatus: ShippingStatus.PENDING,
      });
      await orderRepository.createOrderStatusHistory({
        orderId: ord.id,
        toStatus: OrderStatus.PENDING,
        changedByType: ActorType.CUSTOMER,
        source: "API",
        metadata: {},
      });
    }

    const paymentData = await orderRepository.createPayment({
      checkoutId: checkoutId.id,
      paymentMethod,
      status: PaymentStatus.PENDING,
      provider: "DGS_PGW",
      channel: "CARD",
      currencyCode: "THB",
      amountAuthorizedMinor: grandTotalMinor,
      amountCapturedMinor: grandTotalMinor,
      pgwStatus: "PENDING",
      pgwPayload: { orderId: orderCode, status: "PENDING" },
    });

    let paymentResponse: any;

    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      const body = {
        mid: midCard, order_id: orderCode, amount: grandTotalMinor / 100, expiry: 15,
        url_redirect: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/customer/payment/callback`,
        url_notify: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/customer/payment/notify`,
      };
      const contentSigCard = contentSignature(body);
      paymentResponse = await axios.request({
        method: "post",
        url: `${process.env.WEBSITE_PAYMENT_URL}/payment`,
        data: body,
        headers: { "X-API-ID": apiId, "X-API-Key": apiKey, "X-Partner-ID": partnerId, "X-Content-Signature": contentSigCard },
      });
      await orderRepository.updateOrdersByCheckout(checkoutId.id, { reference: paymentResponse.data.reference });
      await orderRepository.updatePayment(checkoutId.id, {
        urlRedirect: paymentResponse.data.redirect_url,
        providerRef: paymentResponse.data.reference,
      });
      await orderRepository.createPaymentGatewayEvent({
        checkoutId: checkoutId.id, paymentId: paymentData.id, type: "PAYMENT",
        amountMinor: grandTotalMinor, provider: "DGS_PGW", status: "PENDING",
        reqJson: body, resJson: paymentResponse.data,
      });
    }

    if (paymentMethod === PaymentMethod.PROMPTPAY) {
      const body = {
        mid: midQR30, order_id: orderCode, amount: grandTotalMinor / 100, expiry: 15,
        url_redirect: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/customer/payment/callback`,
        url_notify: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/api/customer/payment/notify`,
        qrcode: { biller_reference_1: `REF${orderId[0].id}` },
      };
      const contentSigQr = contentSignature(body);
      paymentResponse = await axios.request({
        method: "post",
        url: `${process.env.WEBSITE_PAYMENT_URL}/payment`,
        data: body,
        headers: { "X-API-ID": apiId, "X-API-Key": apiKey, "X-Partner-ID": partnerId, "X-Content-Signature": contentSigQr },
      });
      await orderRepository.updateOrdersByCheckout(checkoutId.id, { reference: paymentResponse.data.reference });
      await orderRepository.updatePayment(checkoutId.id, {
        urlRedirect: paymentResponse.data.redirect_url,
        providerRef: paymentResponse.data.reference,
      });
      await orderRepository.createPaymentGatewayEvent({
        checkoutId: checkoutId.id, paymentId: paymentData.id, type: "PAYMENT",
        amountMinor: grandTotalMinor, provider: "DGS_PGW", status: "PENDING",
        reqJson: body, resJson: paymentResponse.data,
      });
    }

    if (paymentResponse) {
      await enqueueAutoCancel(
        { orderId: orderId[0].id, createdAt: (orderId[0] as any).createdAt.toString() },
        { delayMs: 15 * 60 * 1000 }
      );
      return { data: paymentResponse.data, queue: true };
    }
    
    throw new BadRequestError("Payment method not supported");
  }

  async deleteOrder(orderCode: string) {
    await orderRepository.destroyCheckout(orderCode);
    return { data: "connect del order" };
  }

  async findShipping() {
    return { data: await orderRepository.findShippingTypes() };
  }

  async createCart(customerId: string, productItemIds: number[], quantities: number[]) {
    for (let i = 0; i < productItemIds.length; i++) {
      const product = await orderRepository.findProductItemById(productItemIds[i]);
      let cardId: number;
      const haveshoppingCart = await orderRepository.findCart(customerId);

      if (!haveshoppingCart) {
        const newCart = await orderRepository.createCart(customerId);
        cardId = newCart.id;
      } else {
        cardId = haveshoppingCart.id;
      }

      if (product) {
        const findProduct = await orderRepository.findCartItem(productItemIds[i]);
        if (findProduct?.productItemId) {
          await orderRepository.updateCartItem(productItemIds[i], { quantity: quantities[i] + findProduct.quantity });
        } else {
          await orderRepository.createCartItem({
            cartId: cardId,
            productItemId: productItemIds[i],
            quantity: quantities[i],
            unitPriceMinor: (product as any).priceMinor,
          });
        }
      }
    }
    return { data: "ok" };
  }

  async updateOrderStatus(orderId: number) {
    const order = await orderRepository.findOrderById(orderId);
    if (order && (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELED_REFUND)) {
      const status = await orderRepository.createOrderStatusHistory({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: OrderStatus.COMPLETE,
        changedByType: ActorType.CUSTOMER,
      });
      await orderRepository.updateOrder(order.id, { status: OrderStatus.COMPLETE });
      return { data: status };
    }
    return { data: null };
  }

  async customerCancel(checkoutId: string) {
    const findOrder = await orderRepository.findOrdersByCheckout(Number(checkoutId));
    await orderRepository.updateOrdersByCheckout(Number(checkoutId), { status: OrderStatus.CUSTOMER_CANCELED });
    await orderRepository.updatePayment(Number(checkoutId), { status: PaymentStatus.FAILED, pgwStatus: "CANCELED" });

    for (const ord of findOrder) {
      const createLog = await orderRepository.createOrderStatusHistory({
        orderId: ord.id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.CUSTOMER_CANCELED,
        changedByType: ActorType.CUSTOMER,
        source: "APP",
        metadata: {},
      });
      await (createLog as any).save();
    }
    return { data: "success" };
  }

  async customerCancelV2(orderId: string) {
    const findOrder = await orderRepository.findOrderById(Number(orderId));
    await orderRepository.updateOrder(Number(orderId), { status: OrderStatus.CUSTOMER_CANCELED });
    if (findOrder) {
      await orderRepository.updatePayment(findOrder.checkoutId, { status: PaymentStatus.FAILED, pgwStatus: "CANCELED" });
    }
    return { data: "success" };
  }

  async revokeCancelOrder(refundId: string) {
    const refund = await orderRepository.findRefundById(Number(refundId));
    if (!refund) throw new NotFoundError("Refund not found");

    const order = await orderRepository.findOrderById(refund.orderId);
    await orderRepository.updateRefundOrder(Number(refundId), { status: RefundStatus.CANCELED });

    if (order) {
      await orderRepository.createOrderStatusHistory({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: OrderStatus.CANCELED_REFUND,
        changedByType: ActorType.CUSTOMER,
        source: "WEB",
      });
    }

    await orderRepository.updateOrder(refund.orderId, { status: OrderStatus.CANCELED_REFUND });
    await orderRepository.createRefundStatusHistory({
      refundOrderId: Number(refundId),
      fromStatus: RefundStatus.REQUESTED,
      toStatus: RefundStatus.CANCELED,
      reason: "customer cancel",
      changedByType: ActorType.CUSTOMER,
      source: "WEBSITE",
    });

    return { data: "success" };
  }

  async cancelOrder(orderId: number, body: { reason?: string; description?: string; contactEmail?: string }, correlationId: string) {
    if (!Number.isFinite(orderId)) throw new BadRequestError("Invalid orderId");

    const ord = await orderRepository.findOrderByPkFull(orderId);
    if (!ord) throw new NotFoundError("Order not found");

    const paidAt = (ord as any).checkout?.payment?.paidAt ?? null;
    const deliveredAt = (ord as any).shippingInfo?.deliveredAt ?? null;
    const { reason, description, contactEmail } = body;

    const transitStatuses: OrderStatus[] = [
      OrderStatus.PROCESSING, OrderStatus.READY_TO_SHIP, OrderStatus.HANDED_OVER,
      OrderStatus.SHIPPED, OrderStatus.TRANSIT_LACK, OrderStatus.RE_TRANSIT,
      OrderStatus.PENDING, OrderStatus.AWAITING_RETURN, OrderStatus.COMPLETE,
      OrderStatus.CUSTOMER_CANCELED, OrderStatus.MERCHANT_CANCELED,
      OrderStatus.RECEIVE_RETURN, OrderStatus.REFUND_APPROVED, OrderStatus.REFUND_FAIL,
      OrderStatus.REFUND_PROCESSING, OrderStatus.REFUND_REJECTED, OrderStatus.REFUND_REQUEST,
      OrderStatus.REFUND_RETRY, OrderStatus.REFUND_SUCCESS, OrderStatus.RETURN_FAIL,
      OrderStatus.RETURN_VERIFIED,
    ];

    if (transitStatuses.includes(ord.status as OrderStatus)) {
      throw new AppError("Cancellation/refund not allowed in this status.", 422);
    }

    if (ord.status === OrderStatus.PENDING) {
      await sequelize.transaction(async (t) => {
        await orderRepository.createOrderStatusHistory({
          orderId: ord.id, fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CUSTOMER_CANCELED, changedByType: ActorType.CUSTOMER,
          source: "WEB", reason: reason ?? "Customer canceled before payment",
        });
        await ord.update({ status: OrderStatus.CUSTOMER_CANCELED } as any, { transaction: t });
      });
      return { data: { id: ord.id, status: OrderStatus.CUSTOMER_CANCELED } };
    }

    const payment = await orderRepository.findPaymentByCheckout(ord.checkoutId);
    if (!payment) throw new BadRequestError("Payment record not found");

    const isDelivered = ord.status === OrderStatus.DELIVERED || ord.status === OrderStatus.CANCELED_REFUND;

    if (isDelivered) {
      if (!deliveredAt) throw new AppError("Missing deliveredAt timestamp", 422);
      if (differenceInDays(new Date(), new Date(deliveredAt)) > OrderPolicy.refundFromDeliveredDays) {
        throw new AppError("Refund request window after delivery has passed", 422);
      }
      const since = addDays(new Date(deliveredAt), -OrderPolicy.refundRetryWindowDays);
      const retryCount = await orderRepository.countRefundsSince(ord.id, since);
      if (retryCount >= OrderPolicy.refundMaxRetries) {
        throw new AppError("Refund request retries exceeded", 429);
      }

      await sequelize.transaction(async (t) => {
        const refund = await orderRepository.createRefundOrder({
          orderId: ord.id, paymentId: payment.id, reason: reason ?? null,
          status: RefundStatus.REQUESTED, amountMinor: ord.grandTotalMinor,
          currencyCode: ord.currencyCode, description: description ?? null,
          contactEmail: contactEmail ?? null, requestedBy: "CUSTOMER", requestedAt: new Date(),
        }, t);
        await orderRepository.createRefundStatusHistory({
          refundOrderId: refund.id, toStatus: RefundStatus.REQUESTED,
          reason: reason ?? "Customer requested refund", changedByType: ActorType.CUSTOMER, source: "WEB",
        }, t);
        await orderRepository.createOrderStatusHistory({
          orderId: ord.id, fromStatus: ord.status, toStatus: OrderStatus.REFUND_REQUEST,
          changedByType: ActorType.CUSTOMER, source: "WEB", reason: reason ?? null,
        });
        await ord.update({ status: OrderStatus.REFUND_REQUEST } as any, { transaction: t });
      });
      return { data: { id: ord.id, status: OrderStatus.REFUND_REQUEST, queued: false } };
    }

    if (ord.status === OrderStatus.PAID) {
      await sequelize.transaction(async (t) => {
        const refund = await orderRepository.createRefundOrder({
          orderId: ord.id, paymentId: payment.id, reason: reason ?? null,
          status: RefundStatus.REQUESTED, amountMinor: ord.grandTotalMinor,
          currencyCode: ord.currencyCode, description: description ?? null,
          contactEmail: contactEmail ?? null, requestedBy: "CUSTOMER", requestedAt: new Date(),
        }, t);
        await orderRepository.createRefundStatusHistory({
          refundOrderId: refund.id, toStatus: RefundStatus.REQUESTED,
          reason: reason ?? "Customer requested refund (PAID)", changedByType: ActorType.CUSTOMER, source: "WEB",
        }, t);
        await orderRepository.createOrderStatusHistory({
          orderId: ord.id, fromStatus: ord.status, toStatus: OrderStatus.REFUND_REQUEST,
          changedByType: ActorType.CUSTOMER, source: "WEB", reason: reason ?? null,
        });
        await ord.update({ status: OrderStatus.REFUND_REQUEST } as any, { transaction: t });
      });

      const hasDelivered = await orderRepository.findOrderStatusHistoryByStatus(ord.id, OrderStatus.DELIVERED);
      if (!hasDelivered) {
        await enqueueRefundAutoApprove({
          orderId: ord.id, requestedAt: new Date().toISOString(),
          correlationId: correlationId, reason: reason ?? "Customer requested refund (pre-delivery)",
        });
        return { data: { id: ord.id, status: OrderStatus.REFUND_REQUEST, queued: true } };
      }
      return { data: { id: ord.id, status: OrderStatus.REFUND_REQUEST, queued: false } };
    }

    throw new AppError(`Cancel/Refund not allowed in status ${ord.status}`, 422);
  }
}

export const orderService = new OrderService();
