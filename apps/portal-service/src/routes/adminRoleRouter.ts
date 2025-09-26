import { Router } from "express"
import {
  adminListRoles,
  adminGetRoleDetail,
  adminCreateRole,
  adminUpdateRoleMeta,
  adminReplaceRolePermissions,
} from "../controllers/adminRoleController"
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin"

const router = Router()

router.get("/list",
  adminListRoles
)

router.get("/:id/detail",
  adminGetRoleDetail
)

router.post("/create",
  adminCreateRole
)

router.patch("/:id/meta",
  adminUpdateRoleMeta
)

router.put("/:id/permissions",
  adminReplaceRolePermissions
)

export default router
