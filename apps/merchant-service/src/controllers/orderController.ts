import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { orderService } from "../services/orderService";
import { OrderListQuery, OrdersSummaryQuery, UpdateOrderPayload } from "../types/order.types";
import { asyncHandler } from "../utils/asyncHandler";

const toQueryString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

const toHeaderString = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

// GET /orders/summary
export const getOrdersSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query: OrdersSummaryQuery = {
    startDate: toQueryString(req.query.startDate),
    endDate: toQueryString(req.query.endDate),
  };

  const result = await orderService.getOrdersSummary(req.store?.id, query);
  return res.json(result);
});

// GET /orders/:orderId
export const getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params as { orderId: string };
  const result = await orderService.getOrderDetail(req.store?.id, orderId);
  return res.json(result);
});

// GET /orders (list)
export const listOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query: OrderListQuery = {
    page: toQueryString(req.query.page),
    pageSize: toQueryString(req.query.pageSize),
    status: toQueryString(req.query.status),
    q: toQueryString(req.query.q),
    startDate: toQueryString(req.query.startDate),
    endDate: toQueryString(req.query.endDate),
    minTotalMinor: toQueryString(req.query.minTotalMinor),
    maxTotalMinor: toQueryString(req.query.maxTotalMinor),
    hasTracking: toQueryString(req.query.hasTracking),
    sortBy: toQueryString(req.query.sortBy),
    sortDir: toQueryString(req.query.sortDir),
  };

  const result = await orderService.getOrderList(req.store?.id, query);
  return res.json(result);
});

// PATCH /orders/:orderId
export const updateOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params as { orderId: string };
  const payload = (req.body ?? {}) as UpdateOrderPayload;

  const result = await orderService.updateOrderStatus({
    orderId,
    storeId: req.store?.id,
    authMode: req.authMode,
    userSub: req.user?.sub,
    userId: req.user?.id,
    headers: {
      requestId: toHeaderString(req.headers["x-request-id"]),
      correlationId: toHeaderString(req.headers["x-correlation-id"]),
      userAgent: toHeaderString(req.headers["user-agent"]),
    },
    ip: req.ip,
    payload,
  });

  return res.json(result);
});

export default {
  getOrdersSummary,
  listOrders,
  updateOrder,
  getOrderById,
};
