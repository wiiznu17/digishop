import { Router } from "express"
import {
  adminListAdmins,
  adminSuggestAdmins,
  adminGetAdminDetail,
  adminCreateAdmin
} from "../controllers/adminUserController"
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin"
import { requirePerms } from "../middlewares/auth"

const router = Router()

// ทั้งหมดเข้าถึงได้เฉพาะ Super Admin
router.get("/list",
  // requireSuperAdmin,
  requirePerms("ADMIN_USERS_READ"),
  adminListAdmins
)

router.get("/suggest",
  // requireSuperAdmin,
  requirePerms("ADMIN_USERS_READ"),
  adminSuggestAdmins
)

router.get("/:id/detail",
  // requireSuperAdmin,
  requirePerms("ADMIN_USERS_READ"),
  adminGetAdminDetail
)

router.post("/create",
  // requireSuperAdmin,
  requirePerms("ADMIN_USERS_CREATE"),
  adminCreateAdmin
)
export default router
