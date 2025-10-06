import { Router } from "express";
import { carrierWebhook } from "../controllers/carrierController";

const router = Router();

// webhook จากขนส่ง
router.post("/webhooks/carriers/:carrier", carrierWebhook);

export default router;
