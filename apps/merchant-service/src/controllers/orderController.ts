import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { orderService, OrderServiceError } from "../services/orderService";
import { OrderListQuery, OrdersSummaryQuery, UpdateOrderPayload } from "../types/order.types";

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

const handleControllerError = (
  res: Response,
  label: string,
  error: unknown,
  fallbackMessage: string,
) => {
  if (error instanceof OrderServiceError) {
    return res.status(error.statusCode).json(error.body);
  }

  console.error(`${label} error:`, error);
  return res.status(500).json({ error: fallbackMessage });
};

// GET /orders/summary
export async function getOrdersSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const query: OrdersSummaryQuery = {
      startDate: toQueryString(req.query.startDate),
      endDate: toQueryString(req.query.endDate),
    };

    const result = await orderService.getOrdersSummary(req.store?.id, query);
    return res.json(result);
  } catch (error) {
    return handleControllerError(res, "getOrdersSummary", error, "Failed to fetch order summary");
  }
}

// GET /orders/:orderId
export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId } = req.params as { orderId: string };
    const result = await orderService.getOrderDetail(req.store?.id, orderId);
    return res.json(result);
  } catch (error) {
    return handleControllerError(res, "getOrderById", error, "Failed to fetch order");
  }
}

// GET /orders (list)
export async function listOrders(req: AuthenticatedRequest, res: Response) {
  try {
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
  } catch (error) {
    return handleControllerError(res, "listOrders", error, "Failed to fetch orders");
  }
}

// PATCH /orders/:orderId
export async function updateOrder(req: AuthenticatedRequest, res: Response) {
  try {
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
  } catch (error) {
    return handleControllerError(res, "updateOrder", error, "Failed to update order");
  }
}

export default {
  getOrdersSummary,
  listOrders,
  updateOrder,
  getOrderById,
};
