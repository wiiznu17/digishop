import { Router } from "express"
import {
  adminListUsers, adminSuggestUsers, adminGetUserDetail,
} from "../controllers/userController"

const router = Router()

// Users
router.get("/list", adminListUsers)
router.get("/suggest", adminSuggestUsers)
router.get("/:id/detail", adminGetUserDetail)

export default router
