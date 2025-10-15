import express from "express";
import {
  getOrdersSummary,
  listOrders,
  updateOrder,
  getOrderById
} from "../controllers/orderController";
import {
  authenticate,
  eitherAuth,
  requireApprovedStore,
  serviceAuth
} from "../middlewares/middleware";

const router: express.Router = express.Router();

// เฉพาะหน้าเว็บ: cookie-JWT เท่านั้น
router.get("/", authenticate, requireApprovedStore(), listOrders);
router.get("/summary", authenticate, requireApprovedStore(), getOrdersSummary);

router.get(
  "/:orderId",
  authenticate,
  requireApprovedStore(),
  getOrderById
);

// PATCH: อนุญาตทั้ง worker (service token) และ user (cookie)
router.patch(
  "/:orderId",
  eitherAuth([serviceAuth, authenticate]),
  requireApprovedStore({ allowAdminBypass: true, allowServiceBypass: true }),
  updateOrder
);

export default router;
