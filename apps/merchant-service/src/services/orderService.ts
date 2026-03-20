import axios from "axios";
import crypto from "crypto";
import {
  ActorType,
  Order,
  OrderStatus,
  RefundStatus,
  ReturnShipment,
  ReturnShipmentStatus,
  ShippingInfo,
  ShippingStatus,
  sequelize,
} from "@digishop/db";
import { Transaction } from "sequelize";
import { orderRepository } from "../repositories/orderRepository";
import {
  OrderListQuery,
  OrderSortField,
  OrdersSummaryData,
  OrdersSummaryQuery,
  PgwDetailResp,
  PgwVoidRefundResp,
  SerializedOrder,
  UpdateOrderInput,
} from "../types/order.types";

class OrderServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? "Order service error"));
    this.name = "OrderServiceError";
  }
}

const toInt = (value: unknown, def: number) => (Number.isFinite(Number(value)) ? Number(value) : def);
const toNum = (value: unknown, def = 0) => (value == null ? def : Number(value));
const minorTo = (value?: number | string | null, dp = 2) => {
  const x = Number(value ?? 0);
  return Number((x / 100).toFixed(dp));
};

const asArray = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

function read<T = unknown>(obj: unknown, ...keys: string[]): T | undefined {
  if (!obj) return undefined;

  const source = obj as {
    get?: (key: string) => unknown;
    [key: string]: unknown;
  };

  for (const key of keys) {
    const viaGet = typeof source.get === "function" ? source.get(key) : undefined;
    if (viaGet !== undefined && viaGet !== null) return viaGet as T;

    const direct = source[key];
    if (direct !== undefined && direct !== null) return direct as T;
  }

  return undefined;
}

const SORT_WHITELIST = new Set<OrderSortField>(["id", "createdAt", "updatedAt", "grandTotalMinor"]);

const PGW_BASE = process.env.PGW_BASE;
const PGW_API_ID = process.env.MERCHANRT_API_ID ?? "";
const PGW_API_KEY = process.env.MERCHANRT_API_KEY ?? "";
const PGW_PARTNER_ID = process.env.MERCHANRT_PARTNER_ID ?? "";
const PGW_LANG = (process.env.PGW_LANG ?? "en") as "en" | "th";

const pathTxnDetail = (ref: string) => `/transaction/${encodeURIComponent(ref)}`;
const pathVoid = (ref: string) => `/transaction/${encodeURIComponent(ref)}/void`;
const pathRefund = (ref: string) => `/transaction/${encodeURIComponent(ref)}/refund`;

function pgwHeaders(correlationId?: string) {
  return {
    "X-API-ID": PGW_API_ID,
    "X-API-Key": PGW_API_KEY,
    "X-Partner-ID": PGW_PARTNER_ID,
    "Accept-Language": PGW_LANG,
    ...(correlationId ? { "X-Request-Id": correlationId } : {}),
  };
}

function normalizeDetailStatus(status?: string) {
  const value = (status ?? "").toLowerCase().replace(/\s+|_/g, "");
  if (value === "approved") return "APPROVED";
  if (value === "presettled") return "PRE_SETTLED";
  if (value === "settled") return "SETTLED";
  return "UNKNOWN";
}

function sanitizeReason(input?: string | null): string {
  const reason = (input ?? "").toString().trim();
  if (!reason) return "Refund requested by merchant";
  return reason.length > 255 ? reason.slice(0, 255) : reason;
}

async function pgwGetDetail(reference: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathTxnDetail(reference)}`;
  const { data } = await axios.get<PgwDetailResp>(url, {
    headers: pgwHeaders(correlationId),
    timeout: 15000,
  });
  return data;
}

async function pgwVoid(reference: string, reason: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathVoid(reference)}`;
  const { data } = await axios.post<PgwVoidRefundResp>(
    url,
    { reason: sanitizeReason(reason) },
    { headers: pgwHeaders(correlationId), timeout: 15000 },
  );
  return data;
}

async function pgwRefund(reference: string, reason: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathRefund(reference)}`;
  const { data } = await axios.post<PgwVoidRefundResp>(
    url,
    { reason: sanitizeReason(reason) },
    { headers: pgwHeaders(correlationId), timeout: 15000 },
  );
  return data;
}

function decidePgwAction(detailStatus: string): "VOID" | "REFUND" | "NONE" {
  const normalized = normalizeDetailStatus(detailStatus);
  if (normalized === "APPROVED") return "VOID";
  if (normalized === "PRE_SETTLED") return "REFUND";
  if (normalized === "SETTLED") return "REFUND";
  return "NONE";
}

function genRequestId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

function serializeOrder(order: Order): SerializedOrder {
  const checkout = read<Record<string, unknown>>(order, "checkout") ?? {};
  const customer = read<Record<string, unknown>>(checkout, "customer") ?? {};
  const shipping = read<Record<string, unknown>>(order, "shippingInfo") ?? {};
  const payment = read<Record<string, unknown>>(checkout, "payment") ?? {};
  const items = asArray<Record<string, unknown>>(read(order, "items"));
  const histories = asArray<Record<string, unknown>>(read(order, "statusHistory"));
  const refundOrders = asArray<Record<string, unknown>>(read(order, "refundOrders"));

  const grandMinor = read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0;
  const shippingSnap = read<number>(shipping, "shipping_price_minor_snapshot", "shippingPriceMinorSnapshot");

  const currency =
    read<string>(order, "currency_code", "currencyCode") ??
    read<string>(payment, "currency_code", "currencyCode") ??
    "THB";

  const customerName =
    read<string>(order, "customer_name_snapshot", "customerNameSnapshot") ??
    [
      read<string>(customer, "firstName", "first_name"),
      read<string>(customer, "lastName", "last_name"),
    ]
      .filter(Boolean)
      .join(" ");

  const customerEmail =
    read<string>(order, "customer_email_snapshot", "customerEmailSnapshot") ??
    read<string>(customer, "email") ??
    "";

  const addrSnap = read<Record<string, unknown>>(shipping, "address_snapshot", "addressSnapshot");

  const shippingAddress = addrSnap
    ? {
        recipientName: (addrSnap.recipientName ?? addrSnap.recipient_name ?? "") as string,
        phone: (addrSnap.phone ?? "") as string,
        addressNumber: (addrSnap.addressNumber ?? addrSnap.address_number ?? undefined) as string | undefined,
        building: (addrSnap.building ?? undefined) as string | undefined,
        subStreet: (addrSnap.subStreet ?? addrSnap.sub_street ?? undefined) as string | undefined,
        street: (addrSnap.street ?? "") as string,
        subdistrict: (addrSnap.subdistrict ?? addrSnap.sub_district ?? undefined) as string | undefined,
        district: (addrSnap.district ?? "") as string,
        province: (addrSnap.province ?? "") as string,
        postalCode: (addrSnap.postalCode ?? addrSnap.postal_code ?? "") as string,
        country: (addrSnap.country ?? "TH") as string,
      }
    : {
        recipientName: "",
        phone: "",
        street: "",
        district: "",
        province: "",
        postalCode: "",
        country: "TH",
      };

  const orderItems = items.map((item) => {
    const product = read<Record<string, unknown>>(item, "product") ?? {};

    return {
      id: String(read<number>(item, "id") ?? ""),
      sku:
        read<string>(item, "product_sku_snapshot", "productSkuSnapshot") ??
        String(read<number>(product, "id") ?? ""),
      name:
        read<string>(item, "product_name_snapshot", "productNameSnapshot") ??
        read<string>(product, "name") ??
        "",
      quantity: toInt(read(item, "quantity"), 0),
      price: minorTo(read<number>(item, "unit_price_minor", "unitPriceMinor"), 2),
      discount: minorTo(read<number>(item, "discount_minor", "discountMinor"), 2),
      taxRate: toNum(read<number>(item, "tax_rate", "taxRate"), 0),
    };
  });

  const shippingEvents = asArray<Record<string, unknown>>(read(shipping, "events")).map((event) => ({
    id: Number(read(event, "id") ?? 0),
    fromStatus: (read<string>(event, "fromStatus") ?? null) as string | null,
    toStatus: (read<string>(event, "toStatus") ?? "") as string,
    description: (read<string>(event, "description") ?? null) as string | null,
    location: (read<string>(event, "location") ?? null) as string | null,
    occurredAt: read<Date>(event, "occurredAt") as Date,
    createdAt: read<Date>(event, "createdAt") as Date,
  }));

  const returnShipments = asArray<Record<string, unknown>>(read(order, "returnShipments")).map((shipment) => ({
    id: Number(read(shipment, "id") ?? 0),
    status: read(shipment, "status") as ReturnShipmentStatus,
    carrier: (read<string>(shipment, "carrier") ?? null) as string | null,
    trackingNumber: (read<string>(shipment, "trackingNumber") ?? null) as string | null,
    shippedAt: (read<Date>(shipment, "shippedAt") ?? null) as Date | null,
    deliveredBackAt: (read<Date>(shipment, "deliveredBackAt") ?? null) as Date | null,
    fromAddressSnapshot: read(shipment, "fromAddressSnapshot") ?? null,
    toAddressSnapshot: read(shipment, "toAddressSnapshot") ?? null,
    events: asArray<Record<string, unknown>>(read(shipment, "events")).map((event) => ({
      id: Number(read(event, "id") ?? 0),
      fromStatus: (read<string>(event, "fromStatus") ?? null) as string | null,
      toStatus: (read<string>(event, "toStatus") ?? "") as string,
      description: (read<string>(event, "description") ?? null) as string | null,
      location: (read<string>(event, "location") ?? null) as string | null,
      occurredAt: read<Date>(event, "occurredAt") as Date,
      createdAt: read<Date>(event, "createdAt") as Date,
    })),
  }));

  const refunds = refundOrders.map((refund) => ({
    id: Number(read(refund, "id") ?? 0),
    status: read(refund, "status") as RefundStatus,
    amountMinor: Number(read(refund, "amountMinor") ?? 0),
    currencyCode: String(read(refund, "currencyCode") ?? "THB"),
    reason: (read<string>(refund, "reason") ?? null) as string | null,
    requestedBy: String(read(refund, "requestedBy") ?? ""),
    requestedAt: read<Date>(refund, "requestedAt") as Date,
    approvedAt: (read<Date>(refund, "approvedAt") ?? null) as Date | null,
    refundedAt: (read<Date>(refund, "refundedAt") ?? null) as Date | null,
  }));

  return {
    id: String(order.id),
    orderCode: String(read(checkout, "orderCode") ?? ""),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    status: order.status,
    statusHistory: histories.map((history) => String(read(history, "toStatus") ?? "")),
    currency,
    subtotal: minorTo(read<number>(order, "subtotal_minor", "subtotalMinor"), 2),
    shippingCost: minorTo(shippingSnap ?? read<number>(order, "shipping_fee_minor", "shippingFeeMinor"), 2),
    tax: minorTo(read<number>(order, "tax_total_minor", "taxTotalMinor"), 2),
    discount: minorTo(read<number>(order, "discount_total_minor", "discountTotalMinor"), 2),
    grandTotal: minorTo(grandMinor, 2),
    paymentMethod: read<string>(payment, "payment_method", "paymentMethod") ?? "",
    payment: Object.keys(payment).length
      ? {
          provider: read<string>(payment, "provider", "provider") ?? undefined,
          providerRef: read<string>(payment, "provider_ref", "providerRef") ?? undefined,
          channel: read<string>(payment, "channel", "channel") ?? undefined,
          pgwStatus: read<string>(payment, "pgw_status", "pgwStatus") ?? undefined,
          paidAt: read<Date>(payment, "paid_at", "paidAt") ?? undefined,
          authorized: minorTo(read<number>(payment, "amount_authorized_minor", "amountAuthorizedMinor"), 2),
          captured: minorTo(read<number>(payment, "amount_captured_minor", "amountCapturedMinor"), 2),
          refunded: minorTo(read<number>(payment, "amount_refunded_minor", "amountRefundedMinor"), 2),
        }
      : undefined,
    shippingType: read<string>(shipping, "shipping_type_name_snapshot", "shippingTypeNameSnapshot") ?? undefined,
    trackingNumber: read<string>(shipping, "tracking_number", "trackingNumber"),
    carrier: read<string>(shipping, "carrier", "carrier"),
    shippedAt: read<Date>(shipping, "shipped_at", "shippedAt"),
    deliveredAt: read<Date>(shipping, "delivered_at", "deliveredAt"),
    returnedToSenderAt: read<Date>(shipping, "returned_to_sender_at", "returnedToSenderAt"),
    shippingStatus: read<ShippingStatus>(shipping, "shipping_status", "shippingStatus"),
    shippingAddress,
    shipping: Object.keys(shipping).length ? { events: shippingEvents } : undefined,
    returnShipments,
    customerName,
    customerEmail,
    customerPhone: shippingAddress.phone ?? "",
    orderItems,
    notes: read<string>(order, "order_note", "orderNote") ?? undefined,
    refunds,
  };
}

export class OrderService {
  private async rollbackIfNeeded(transaction: Transaction) {
    const tx = transaction as Transaction & { finished?: string };
    if (tx.finished) return;
    await transaction.rollback();
  }

  async getOrdersSummary(storeId: number | undefined, query: OrdersSummaryQuery) {
    const { startDate, endDate } = query;

    const [
      totalOrders,
      pendingPayment,
      paidOrders,
      processing,
      handedOver,
      refunds,
      refundSuccessOrders,
      canceledOrders,
      completed,
      revenueOrders,
    ] = await Promise.all([
      orderRepository.countOrdersByStoreAndDate({ storeId, startDate, endDate }),
      orderRepository.countOrdersByStoreAndDate({ storeId, startDate, endDate, statuses: [OrderStatus.PENDING] }),
      orderRepository.countOrdersByStoreAndDate({ storeId, startDate, endDate, statuses: [OrderStatus.PAID] }),
      orderRepository.countOrdersByStoreAndDate({
        storeId,
        startDate,
        endDate,
        statuses: [OrderStatus.PROCESSING, OrderStatus.READY_TO_SHIP],
      }),
      orderRepository.countOrdersByStoreAndDate({
        storeId,
        startDate,
        endDate,
        statuses: [OrderStatus.HANDED_OVER, OrderStatus.SHIPPED, OrderStatus.TRANSIT_LACK, OrderStatus.RE_TRANSIT],
      }),
      orderRepository.countOrdersByStoreAndDate({
        storeId,
        startDate,
        endDate,
        statuses: [
          OrderStatus.REFUND_REQUEST,
          OrderStatus.AWAITING_RETURN,
          OrderStatus.RETURN_VERIFIED,
          OrderStatus.REFUND_APPROVED,
          OrderStatus.REFUND_REJECTED,
          OrderStatus.REFUND_FAIL,
          OrderStatus.REFUND_RETRY,
          OrderStatus.REFUND_SUCCESS,
        ],
      }),
      orderRepository.countOrdersByStoreAndDate({
        storeId,
        startDate,
        endDate,
        statuses: [OrderStatus.REFUND_SUCCESS],
      }),
      orderRepository.countOrdersByStoreAndDate({
        storeId,
        startDate,
        endDate,
        statuses: [OrderStatus.CUSTOMER_CANCELED, OrderStatus.MERCHANT_CANCELED],
      }),
      orderRepository.countOrdersByStoreAndDate({
        storeId,
        startDate,
        endDate,
        statuses: [OrderStatus.DELIVERED, OrderStatus.COMPLETE],
      }),
      orderRepository.findOrderGrandTotalsByStoreAndDate({
        storeId,
        startDate,
        endDate,
        excludeStatuses: [OrderStatus.CUSTOMER_CANCELED, OrderStatus.MERCHANT_CANCELED, OrderStatus.REFUND_SUCCESS],
      }),
    ]);

    const totalRevenueMinor = revenueOrders.reduce((sum, order) => sum + (order.grandTotalMinor ?? 0), 0);

    const data: OrdersSummaryData = {
      totalOrders,
      pendingPayment,
      paidOrders,
      processing,
      handedOver,
      refundRequests: refunds,
      refundSuccessOrders,
      canceledOrders,
      totalRevenueMinor,
      totalRevenue: minorTo(totalRevenueMinor, 2),
      completed,
    };

    return { data };
  }

  async getOrderDetail(storeId: number | undefined, orderId: string) {
    if (!orderId) {
      throw new OrderServiceError(400, { error: "Missing order id" });
    }

    if (storeId) {
      const owned = await orderRepository.findOrderByIdAndStore(orderId, storeId);
      if (owned === 0) {
        throw new OrderServiceError(403, { error: "Forbidden: You don't have access to this order" });
      }
    }

    const order = await orderRepository.findOrderByPkWithBaseIncludes(orderId);
    if (!order) {
      throw new OrderServiceError(404, { error: "Order not found" });
    }

    return { data: serializeOrder(order) };
  }

  async getOrderList(storeId: number | undefined, query: OrderListQuery) {
    const {
      page = "1",
      pageSize = "20",
      status,
      q,
      startDate,
      endDate,
      minTotalMinor,
      maxTotalMinor,
      hasTracking,
      sortBy = "createdAt",
      sortDir = "DESC",
    } = query;

    const pageNum = toInt(page, 1);
    const limit = pageNum > 0 ? toInt(pageSize, 20) : 20;
    const offset = (pageNum - 1) * limit;

    const orderField: OrderSortField = SORT_WHITELIST.has(sortBy as OrderSortField)
      ? (sortBy as OrderSortField)
      : "createdAt";
    const orderDir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { rows, count } = await orderRepository.findAndCountOrdersForList({
      storeId,
      status,
      q,
      startDate,
      endDate,
      minTotalMinor,
      maxTotalMinor,
      hasTracking,
      sortBy: orderField,
      sortDir: orderDir,
      limit,
      offset,
    });

    return {
      data: rows.map((row) => serializeOrder(row)),
      meta: {
        page: pageNum,
        pageSize: limit,
        total: count,
      },
    };
  }

  async updateOrderStatus(input: UpdateOrderInput) {
    const { orderId, storeId, authMode, userSub, userId, headers, ip, payload } = input;
    const { status: nextStatusRaw, reason } = payload;

    if (!orderId) {
      throw new OrderServiceError(400, { error: "Missing order id" });
    }

    const isService = authMode === "service";
    const changedByIdRaw = userSub ?? userId ?? null;
    const changedById = Number.isFinite(Number(changedByIdRaw)) ? Number(changedByIdRaw) : null;
    const changedByType = isService ? ActorType.SYSTEM : ActorType.MERCHANT;

    const correlationId = headers.requestId ?? headers.correlationId ?? null;

    if (!isService && !storeId) {
      throw new OrderServiceError(403, { error: "Forbidden: Store context required" });
    }

    if (!isService && storeId) {
      const owned = await orderRepository.findOrderByIdAndStore(orderId, storeId);
      if (owned === 0) {
        throw new OrderServiceError(403, { error: "Forbidden: You don't have access to this order" });
      }
    }

    const mapShipping: Record<string, ShippingStatus | undefined> = {
      READY_TO_SHIP: ShippingStatus.READY_TO_SHIP,
    };

    const MERCHANT_ALLOWED_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.MERCHANT_CANCELED],
      [OrderStatus.PROCESSING]: [OrderStatus.READY_TO_SHIP],
      [OrderStatus.REFUND_REQUEST]: [
        OrderStatus.REFUND_APPROVED,
        OrderStatus.AWAITING_RETURN,
        OrderStatus.REFUND_REJECTED,
      ],
      [OrderStatus.RECEIVE_RETURN]: [OrderStatus.RETURN_VERIFIED],
      [OrderStatus.RETURN_VERIFIED]: [OrderStatus.REFUND_APPROVED],
      [OrderStatus.REFUND_FAIL]: [OrderStatus.REFUND_RETRY],
    };

    const TERMINAL = new Set<OrderStatus>([
      OrderStatus.COMPLETE,
      OrderStatus.CUSTOMER_CANCELED,
      OrderStatus.REFUND_SUCCESS,
      OrderStatus.RETURN_FAIL,
    ]);

    const transaction = await sequelize.transaction();
    let postCommit: null | (() => Promise<void>) = null;

    try {
      const order = await orderRepository.findOrderByPkWithBaseIncludes(orderId, transaction);
      if (!order) {
        throw new OrderServiceError(404, { error: "Order not found" });
      }

      const current = order.status as OrderStatus;
      const nextStatus = (nextStatusRaw as OrderStatus) || undefined;

      if (TERMINAL.has(current)) {
        throw new OrderServiceError(400, {
          error: `Order is terminal (${current}), cannot transition`,
        });
      }

      const allowed = MERCHANT_ALLOWED_NEXT[current] ?? [];
      if (!allowed.includes(nextStatus as OrderStatus)) {
        throw new OrderServiceError(400, {
          error: `Invalid transition for merchant: ${current} -> ${nextStatus}`,
          allowedNext: allowed,
        });
      }

      await orderRepository.updateOrderStatus(order, nextStatus as OrderStatus, transaction);

      await orderRepository.createOrderStatusHistory(
        {
          orderId: Number(order.id),
          fromStatus: current,
          toStatus: nextStatus as OrderStatus,
          changedByType,
          changedById,
          reason: reason ?? null,
          source: isService ? "SERVICE" : "WEB",
          correlationId,
          metadata: { ip, ua: headers.userAgent ?? null },
        },
        transaction,
      );

      const ship = read<ShippingInfo>(order, "shippingInfo");
      const newShipStatus = mapShipping[nextStatus as string];

      if (ship && newShipStatus) {
        const now = new Date();
        const lastEvent = await orderRepository.findLatestShipmentEvent(ship.id, transaction);
        const fromStatus =
          (lastEvent?.get("toStatus") as ShippingStatus | undefined) ?? ship.shippingStatus ?? null;

        await orderRepository.updateShippingInfo(
          ship,
          { shippingStatus: newShipStatus },
          transaction,
        );

        await orderRepository.createShipmentEvent(
          {
            shippingInfoId: ship.id,
            fromStatus,
            toStatus: newShipStatus,
            description: `Order status changed to ${nextStatus} by ${changedByType}`,
            location: null,
            rawPayload: null,
            occurredAt: now,
          },
          transaction,
        );
      }

      if (nextStatus === OrderStatus.RETURN_VERIFIED) {
        if (current !== OrderStatus.RECEIVE_RETURN) {
          throw new OrderServiceError(409, { error: "order_not_in_receive_return" });
        }

        const now = new Date();
        const ret = await orderRepository.findReturnShipmentByOrderId(order.id, transaction);

        const useReturnEvent = Boolean(ret);
        const useRtsEvent = !useReturnEvent && ship && ship.shippingStatus === ShippingStatus.RETURNED_TO_SENDER;

        if (useReturnEvent && ret) {
          const before = ret.status as ReturnShipmentStatus;
          await orderRepository.createReturnShipmentEvent(
            {
              returnShipmentId: ret.id,
              fromStatus: before,
              toStatus: before,
              occurredAt: now,
              description: "Merchant verified goods (RETURN_VERIFIED)",
              location: null,
            },
            transaction,
          );
        }

        if (useRtsEvent && ship) {
          const beforeShip = ship.shippingStatus ?? null;
          await orderRepository.createShipmentEvent(
            {
              shippingInfoId: ship.id,
              fromStatus: beforeShip,
              toStatus: beforeShip,
              description: "Merchant verified goods from RTS (RETURN_VERIFIED)",
              location: null,
              rawPayload: { source: "RTS_VERIFY" },
              occurredAt: now,
            },
            transaction,
          );
        }
      }

      let refund = await orderRepository.findRefundOrderByOrderId(order.id, transaction);
      if (
        [
          OrderStatus.REFUND_REQUEST,
          OrderStatus.REFUND_APPROVED,
          OrderStatus.MERCHANT_CANCELED,
          OrderStatus.REFUND_SUCCESS,
          OrderStatus.REFUND_FAIL,
          OrderStatus.REFUND_RETRY,
          OrderStatus.AWAITING_RETURN,
          OrderStatus.REFUND_REJECTED,
        ].includes(nextStatus as OrderStatus)
      ) {
        const beforeRefundStatus = refund?.status as RefundStatus | undefined;
        const orderGrandMinor = read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0;
        const currency = read<string>(order, "currency_code", "currencyCode") ?? "THB";

        if (!refund && nextStatus === OrderStatus.MERCHANT_CANCELED) {
          refund = await orderRepository.createRefundOrder(
            {
              orderId: order.id,
              reason: reason ?? null,
              amountMinor: orderGrandMinor,
              currencyCode: currency,
              status: RefundStatus.APPROVED,
              requestedBy: "MERCHANT",
              requestedAt: new Date(),
              approvedAt: nextStatus === OrderStatus.MERCHANT_CANCELED ? new Date() : null,
              metadata: { via: "updateOrder" },
            },
            transaction,
          );

          await orderRepository.createRefundStatusHistory(
            {
              refundOrderId: Number(refund.id),
              fromStatus: null,
              toStatus: refund.status,
              reason: reason ?? null,
              changedByType,
              changedById,
              source: isService ? "SERVICE" : "WEB",
              correlationId,
              metadata: {},
            },
            transaction,
          );
        } else if (refund) {
          if (nextStatus === OrderStatus.REFUND_APPROVED && refund.status !== RefundStatus.APPROVED) {
            await orderRepository.updateRefundOrder(
              refund,
              { status: RefundStatus.APPROVED, approvedAt: new Date() },
              transaction,
            );

            await orderRepository.createRefundStatusHistory(
              {
                refundOrderId: Number(refund.id),
                fromStatus: beforeRefundStatus ?? null,
                toStatus: RefundStatus.APPROVED,
                reason: reason ?? null,
                changedByType,
                changedById,
                source: isService ? "SERVICE" : "WEB",
                correlationId,
                metadata: {},
              },
              transaction,
            );
          } else if (nextStatus === OrderStatus.REFUND_SUCCESS && refund.status !== RefundStatus.SUCCESS) {
            await orderRepository.updateRefundOrder(
              refund,
              { status: RefundStatus.SUCCESS, refundedAt: new Date() },
              transaction,
            );

            await orderRepository.createRefundStatusHistory(
              {
                refundOrderId: Number(refund.id),
                fromStatus: beforeRefundStatus ?? null,
                toStatus: RefundStatus.SUCCESS,
                reason: reason ?? null,
                changedByType,
                changedById,
                source: isService ? "SERVICE" : "WEB",
                correlationId,
                metadata: {},
              },
              transaction,
            );
          } else if (nextStatus === OrderStatus.REFUND_FAIL && refund.status !== RefundStatus.FAIL) {
            await orderRepository.updateRefundOrder(refund, { status: RefundStatus.FAIL }, transaction);

            await orderRepository.createRefundStatusHistory(
              {
                refundOrderId: Number(refund.id),
                fromStatus: beforeRefundStatus ?? null,
                toStatus: RefundStatus.FAIL,
                reason: reason ?? null,
                changedByType,
                changedById,
                source: isService ? "SERVICE" : "WEB",
                correlationId,
                metadata: {},
              },
              transaction,
            );
          } else if (nextStatus === OrderStatus.AWAITING_RETURN && refund.status === RefundStatus.REQUESTED) {
            if (!ship || ship.shippingStatus !== ShippingStatus.DELIVERED) {
              throw new OrderServiceError(409, { error: "order_not_delivered_cannot_request_return" });
            }

            let ret = await orderRepository.findReturnShipmentByOrderId(order.id, transaction);
            if (ret) {
              throw new OrderServiceError(409, { error: "return_shipment_already_exists" });
            }

            const deadlineAt = new Date();
            deadlineAt.setDate(deadlineAt.getDate() + 7);

            const fromAddressSnapshot = read(ship, "address_snapshot", "addressSnapshot") ?? null;
            const toAddressSnapshot = null;

            ret = await orderRepository.createReturnShipment(
              {
                orderId: order.id,
                refundOrderId: refund.id,
                status: ReturnShipmentStatus.AWAITING_DROP,
                carrier: null,
                trackingNumber: null,
                shippedAt: null,
                deliveredBackAt: null,
                fromAddressSnapshot: fromAddressSnapshot as object | null,
                toAddressSnapshot,
                deadlineDropoffAt: deadlineAt,
              },
              transaction,
            );

            await orderRepository.createReturnShipmentEvent(
              {
                returnShipmentId: ret.id,
                fromStatus: null,
                toStatus: ReturnShipmentStatus.AWAITING_DROP,
                occurredAt: new Date(),
                description: "Return created (REFUND_REQUEST -> AWAITING_RETURN)",
              },
              transaction,
            );
          } else if (nextStatus === OrderStatus.REFUND_REJECTED && refund.status !== RefundStatus.CANCELED) {
            await orderRepository.updateRefundOrder(
              refund,
              {
                status: RefundStatus.CANCELED,
                merchantRejectReason: reason,
              },
              transaction,
            );

            await orderRepository.createRefundStatusHistory(
              {
                refundOrderId: Number(refund.id),
                fromStatus: beforeRefundStatus ?? null,
                toStatus: RefundStatus.CANCELED,
                reason: reason ?? null,
                changedByType,
                changedById,
                source: isService ? "SERVICE" : "WEB",
                correlationId,
                metadata: {},
              },
              transaction,
            );
          }
        }
      }

      if ([OrderStatus.REFUND_APPROVED, OrderStatus.MERCHANT_CANCELED, OrderStatus.REFUND_RETRY].includes(nextStatus as OrderStatus)) {
        const checkout = read<Record<string, unknown>>(order, "checkout") ?? {};
        const payment = read<Record<string, unknown>>(checkout, "payment") ?? {};

        const paymentId = read<number>(payment, "id");
        const providerRef = read<string>(payment, "provider_ref", "providerRef");
        const orderRef = read<string>(order, "reference", "reference");
        const reference = orderRef || providerRef;

        const refundRow = refund ?? (await orderRepository.findRefundOrderByOrderId(order.id, transaction));
        const refundOrderId = refundRow?.id;
        const prev = nextStatus as OrderStatus;
        const requestId = genRequestId();

        postCommit = async () => {
          if (!reference || !paymentId) {
            await orderRepository.updateOrderStatusById(orderId, OrderStatus.REFUND_FAIL);

            if (refundOrderId) {
              await orderRepository.createRefundStatusHistory({
                refundOrderId,
                fromStatus: RefundStatus.APPROVED,
                toStatus: RefundStatus.FAIL,
                reason: "Missing payment reference",
                changedByType: ActorType.SYSTEM,
                changedById: 0,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: {},
              });
            }
            return;
          }

          const amountMinor = refundRow?.amountMinor || 0;

          try {
            const detail = await pgwGetDetail(reference, correlationId ?? undefined);
            const action = decidePgwAction(detail?.transaction?.status ?? "");

            if (action === "NONE") {
              await orderRepository.updateOrderStatusById(orderId, OrderStatus.REFUND_FAIL);
              await orderRepository.createOrderStatusHistory({
                orderId: Number(orderId),
                fromStatus: prev,
                toStatus: OrderStatus.REFUND_FAIL,
                changedByType: ActorType.SYSTEM,
                changedById: 0,
                reason: `${action} is not do anything at payment gateway`,
                source: "WEB",
                correlationId,
              });

              if (refundOrderId) {
                await orderRepository.createRefundStatusHistory({
                  refundOrderId,
                  fromStatus: RefundStatus.APPROVED,
                  toStatus: RefundStatus.FAIL,
                  reason: `Unsupported PGW status: ${detail?.status ?? "unknown"}`,
                  changedByType: ActorType.SYSTEM,
                  changedById: 0,
                  source: "PAYMENT_GATEWAY",
                  correlationId,
                  metadata: { detail },
                });
              }

              await orderRepository.createPaymentGatewayEvent({
                checkoutId: (read<number>(checkout, "id") ?? null) as number | null,
                paymentId,
                refundOrderId: refundOrderId ?? null,
                type: action,
                amountMinor,
                provider: read<string>(payment, "provider") ?? "UNKNOWN",
                providerRef: providerRef ?? null,
                status: "FAILED",
                requestId,
                reqJson: { step: "decide", detail },
                resJson: { reason: "UNSUPPORTED_STATUS" },
              });
              return;
            }

            const payloadReason =
              reason ?? (nextStatus === OrderStatus.MERCHANT_CANCELED ? "Merchant canceled" : "Refund approved / retry");

            const response =
              action === "VOID"
                ? await pgwVoid(reference, payloadReason, correlationId ?? undefined)
                : await pgwRefund(reference, payloadReason, correlationId ?? undefined);

            const ok = response?.res_code === "0000";

            await orderRepository.createPaymentGatewayEvent({
              checkoutId: (read<number>(checkout, "id") ?? null) as number | null,
              paymentId,
              refundOrderId: refundOrderId ?? null,
              type: action,
              amountMinor,
              provider: read<string>(payment, "provider") ?? "UNKNOWN",
              providerRef: providerRef ?? null,
              status: ok ? "SUCCESS" : "FAILED",
              requestId,
              reqJson: { action, reason: payloadReason },
              resJson: response,
            });

            if (ok) {
              await orderRepository.updateOrderStatusById(orderId, OrderStatus.REFUND_PROCESSING);
              await orderRepository.createOrderStatusHistory({
                orderId: Number(orderId),
                fromStatus: prev,
                toStatus: OrderStatus.REFUND_SUCCESS,
                changedByType: ActorType.SYSTEM,
                changedById: 0,
                reason: `${action} accepted by PGW`,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response, retry: nextStatus === OrderStatus.REFUND_RETRY },
              });

              if (refundOrderId) {
                await orderRepository.createRefundStatusHistory({
                  refundOrderId,
                  fromStatus: RefundStatus.APPROVED,
                  toStatus: RefundStatus.SUCCESS,
                  reason: `${action} accepted by PGW`,
                  changedByType: ActorType.SYSTEM,
                  changedById: 0,
                  source: "PAYMENT_GATEWAY",
                  correlationId,
                  metadata: { response },
                });
              }
            } else {
              await orderRepository.updateOrderStatusById(orderId, OrderStatus.REFUND_FAIL);
              await orderRepository.createOrderStatusHistory({
                orderId: Number(orderId),
                fromStatus: prev,
                toStatus: OrderStatus.REFUND_FAIL,
                changedByType: ActorType.SYSTEM,
                changedById: 0,
                reason: `${action} failed: ${response?.res_desc ?? "unknown"}`,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response, retry: nextStatus === OrderStatus.REFUND_RETRY },
              });

              if (refundOrderId) {
                await orderRepository.createRefundStatusHistory({
                  refundOrderId,
                  fromStatus: RefundStatus.APPROVED,
                  toStatus: RefundStatus.FAIL,
                  reason: `${action} failed: ${response?.res_desc ?? "unknown"}`,
                  changedByType: ActorType.SYSTEM,
                  changedById: 0,
                  source: "PAYMENT_GATEWAY",
                  correlationId,
                  metadata: { response, retry: nextStatus === OrderStatus.REFUND_RETRY },
                });
              }
            }
          } catch (error) {
            const pgwError = error as { response?: { data?: unknown }; message?: string };

            await orderRepository.updateOrderStatusById(orderId, OrderStatus.REFUND_FAIL);
            await orderRepository.createOrderStatusHistory({
              orderId: Number(orderId),
              fromStatus: prev,
              toStatus: OrderStatus.REFUND_FAIL,
              changedByType: ActorType.SYSTEM,
              changedById: 0,
              reason: "PGW API error",
              source: "PAYMENT_GATEWAY",
              correlationId,
              metadata: {
                error: pgwError.response?.data ?? pgwError.message,
                retry: nextStatus === OrderStatus.REFUND_RETRY,
              },
            });

            if (refundOrderId) {
              await orderRepository.createRefundStatusHistory({
                refundOrderId,
                fromStatus: RefundStatus.APPROVED,
                toStatus: RefundStatus.FAIL,
                reason: "PGW API error",
                changedByType: ActorType.SYSTEM,
                changedById: 0,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: {
                  error: pgwError.response?.data ?? pgwError.message,
                  retry: nextStatus === OrderStatus.REFUND_RETRY,
                },
              });
            }

            await orderRepository.createPaymentGatewayEvent({
              checkoutId: (read<number>(checkout, "id") ?? null) as number | null,
              paymentId,
              refundOrderId: refundOrderId ?? null,
              type: "ERROR",
              amountMinor,
              provider: read<string>(payment, "provider") ?? "UNKNOWN",
              providerRef: providerRef ?? null,
              status: "FAILED",
              requestId,
              reqJson: { note: "PGW API error" },
              resJson: pgwError.response?.data ?? { message: pgwError.message ?? "unknown" },
            });
          }
        };
      }

      await orderRepository.reloadOrderWithBaseIncludes(order, transaction);
      await transaction.commit();

      if (postCommit) {
        await postCommit();
      }

      const fresh = await orderRepository.findFreshOrderWithBaseIncludes(orderId);
      return { data: serializeOrder(fresh ?? order) };
    } catch (error) {
      await this.rollbackIfNeeded(transaction);

      if (error instanceof OrderServiceError) {
        throw error;
      }

      console.error("updateOrder error:", error);
      throw new OrderServiceError(500, { error: "Failed to update order" });
    }
  }
}

export const orderService = new OrderService();
export { OrderServiceError };
