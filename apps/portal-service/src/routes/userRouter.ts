import express from "express"
import {
  adminListUsers, adminSuggestUsers, adminGetUserDetail,
} from "../controllers/userController"
import { requirePerms } from "../middlewares/auth"

const router: express.Router = express.Router();

// Users
router.get("/list",
  requirePerms("CUSTOMERS_READ"),
  adminListUsers
)

router.get("/suggest",
  requirePerms("CUSTOMERS_READ"),
  adminSuggestUsers
)

router.get("/:id/detail",
  requirePerms("CUSTOMERS_READ"),
  adminGetUserDetail
)

export default router
