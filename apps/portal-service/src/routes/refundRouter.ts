import { adminListRefunds } from "../controllers/refundController";
import express  from "express";
import { requirePerms } from "../middlewares/auth";

const router: express.Router = express.Router();

router.get("/list",
  requirePerms("REFUNDS_READ"),
  adminListRefunds
);

export default router;