import { adminListRefunds } from "../controllers/refundController";
import { Router } from "express";
import { requirePerms } from "../middlewares/auth";

const router = Router();

router.get("/list",
  requirePerms("ORDER.READ"),
  adminListRefunds
);

export default router;