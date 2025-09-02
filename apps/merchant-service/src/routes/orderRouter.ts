import { Router } from "express"
import { getOrdersSummary, listOrders, updateOrder } from "../controllers/orderController"

const router = Router()

router.get("/", listOrders)
router.get("/summary", getOrdersSummary)
router.patch("/:orderId", updateOrder)

export default router
