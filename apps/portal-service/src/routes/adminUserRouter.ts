import { Router } from "express"
import {
  adminListAdmins,
  adminSuggestAdmins,
  adminGetAdminDetail,
  adminCreateAdmin
} from "../controllers/adminUserController"
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin"

const router = Router()

// ทั้งหมดเข้าถึงได้เฉพาะ Super Admin
router.get("/list",
  // requireSuperAdmin,
  adminListAdmins
)

router.get("/suggest",
  // requireSuperAdmin,
  adminSuggestAdmins
)

router.get("/:id/detail",
  // requireSuperAdmin,
  adminGetAdminDetail
)

router.post("/create",
  // requireSuperAdmin,
  adminCreateAdmin
)
export default router
