import { Router } from "express";
import { requirePerms } from "../middlewares/auth";
import { adminListOrders, adminGetOrderDetail, adminSuggestOrders, adminSuggestCustomerEmails } from "../controllers/orderController";

const router = Router();

router.get("/list",
  requirePerms("ORDERS_READ"),
  adminListOrders
);

router.get("/:id/detail",
  requirePerms("ORDERS_READ"),
  adminGetOrderDetail
);

router.get("/suggest",
  requirePerms("ORDERS_READ"),
  adminSuggestOrders 
);

router.get("/customer-suggest",
  requirePerms("ORDERS_READ"),
  adminSuggestCustomerEmails
);


export default router;
