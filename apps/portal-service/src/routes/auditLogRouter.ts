import { Router } from "express"
import {
  adminListAuditLogs,
  adminGetAuditLogDetail,
  adminSuggestAuditLogs,
} from "../controllers/auditLogController"
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin"

const router = Router()

router.get("/list", adminListAuditLogs)
router.get("/suggest", adminSuggestAuditLogs)
router.get("/:id/detail", adminGetAuditLogDetail)

export default router
