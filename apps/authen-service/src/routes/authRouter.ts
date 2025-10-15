import express from "express"
import { login, logout, me } from "../controllers/authController"

// const router = Router()
const router: express.Router = express.Router();

router.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

router.post("/login", login)
router.post("/logout", logout)
router.get("/me", me)
// router.get('/', getAllUsers)

export default router
