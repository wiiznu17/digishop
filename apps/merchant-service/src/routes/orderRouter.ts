import { Router } from "express";
import { getOrdersSummary, listOrders, updateOrder } from "../controllers/orderController";
import { authenticate, eitherAuth, requireApprovedStore, serviceAuth } from "../middlewares/middleware";

const router = Router();

// เฉพาะหน้าเว็บ: cookie-JWT เท่านั้น
router.get("/", authenticate, requireApprovedStore(), listOrders);
router.get("/summary", authenticate, requireApprovedStore(), getOrdersSummary);

// PATCH: อนุญาตทั้ง worker (service token) และ user (cookie)
router.patch(
  "/:orderId",
  eitherAuth([serviceAuth, authenticate]),
  requireApprovedStore({ allowAdminBypass: true, allowServiceBypass: true }),
  updateOrder
);

export default router;
