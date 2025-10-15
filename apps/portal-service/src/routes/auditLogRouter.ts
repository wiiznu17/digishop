import express from "express"
import {
  adminListAuditLogs,
  adminGetAuditLogDetail,
  adminSuggestAuditLogs,
} from "../controllers/auditLogController"
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin"
import { requirePerms } from "../middlewares/auth"

const router: express.Router = express.Router();

router.get("/list",
  requirePerms("AUDIT_LOGS_READ"),
  adminListAuditLogs
)

router.get("/suggest",
  requirePerms("AUDIT_LOGS_READ"),
  adminSuggestAuditLogs
)

router.get("/:id/detail",
  requirePerms("AUDIT_LOGS_READ"),
  adminGetAuditLogDetail
)

export default router
