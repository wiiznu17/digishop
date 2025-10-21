import express from "express";
import { access, login, logout, refresh } from "../controllers/authController";
import { authenticateUser } from "../middlewares/authenticateUser";

const router: express.Router = express.Router();

router.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// ต้องมี access token + session ถูกต้อง
router.get("/me", authenticateUser, access);

export default router;
