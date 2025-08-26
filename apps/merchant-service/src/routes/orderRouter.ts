import { Router } from "express"
import { listOrders, updateOrder } from "../controllers/orderController"

const router = Router()

router.get("/", listOrders)
router.patch("/:orderId", updateOrder)

export default router
