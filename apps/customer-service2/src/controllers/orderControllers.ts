import { Request, Response, RequestHandler, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { orderService } from "../services/orderService";

export const findOrder: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const result = await orderService.findOrder(id, userId);
  res.status(200).json({ body: result });
});

export const findUserOrder: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await orderService.findUserOrder(id);
  res.status(200).json(result);
});

export const findUserCart: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await orderService.findUserCart(id);
  if (!result) return res.json({ data: [], count: 0 });
  res.json(result);
});

export const deleteChart: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const item = req.body;
  const result = await orderService.deleteCart(item);
  res.json(result);
});

export const createOrderId: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, orderData } = req.body;
  const result = await orderService.createOrderId(customerId, orderData);
  res.json(result);
});

export const createOrder: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.createOrder(req.body);
  res.status(200).json(result);
});

export const deleteOrder: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await orderService.deleteOrder(id);
  res.status(200).json(result);
});

export const findShipping: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.findShipping();
  res.json(result);
});

export const createCart: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, productItemId, quantity } = req.body;
  const result = await orderService.createCart(customerId, productItemId, quantity);
  res.json(result);
});

export const updateOrderStatus: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await orderService.updateOrderStatus(Number(id));
  res.json(result);
});

export const customerCancel: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await orderService.customerCancel(id);
  res.json(result);
});

export const customerCancelV2: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await orderService.customerCancelV2(id);
  res.json(result);
});

export const revokeCancelOrder: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await orderService.revokeCancelOrder(id);
  res.json(result);
});

export const cancelOrder: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const correlationId = (req.headers["x-request-id"] as string) || `cust-${id}-${Date.now()}`;
  const result = await orderService.cancelOrder(id, req.body ?? {}, correlationId);
  res.json(result);
});
