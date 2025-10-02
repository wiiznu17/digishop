// apps/merchant-service/src/routes/orders.ts
import { Router } from "express";
import { carrierWebhook, getOrdersSummary, listOrders, updateOrder } from "../controllers/orderController";
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

// webhook จากขนส่ง: แล้วแต่คุณว่าจะลงลายเซ็นที่ controller แทน (ตามโค้ดเดิม)
router.post("/webhooks/carriers/:carrier", carrierWebhook);

export default router;
