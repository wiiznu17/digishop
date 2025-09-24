import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import * as AuthController from "../controllers/authController";
import { authenticateAdmin } from "../middlewares/auth";

const router = Router();

// ระบุ type ชัดเจนเพื่อกัน TS งอแงเรื่อง overload
const loginLimiter: RequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
}) as unknown as RequestHandler;

const refreshLimiter: RequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
}) as unknown as RequestHandler;

router.post("/login",
  loginLimiter,
  AuthController.login
);

router.post("/refresh",
  refreshLimiter,
  AuthController.refresh
);

router.post("/logout",
  AuthController.logout
);

router.get("/access",
  authenticateAdmin,
  AuthController.access
)

export default router;
