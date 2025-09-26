import { Router } from "express";
import { requirePerms } from "../middlewares/auth";
import { adminListOrders, adminGetOrderDetail, adminSuggestOrders, adminSuggestCustomerEmails } from "../controllers/orderController";

const router = Router();

router.get("/list",
  requirePerms("ORDER.READ"),
  adminListOrders
);

router.get("/:id/detail",
  requirePerms("ORDER.READ"),
  adminGetOrderDetail
);

router.get("/suggest",
  requirePerms("ORDER.READ"),
  adminSuggestOrders 
);

router.get("/customer-suggest",
  requirePerms("ORDER.READ"),
  adminSuggestCustomerEmails
);


export default router;
