import { Router } from "express"
import { requirePerms } from "../middlewares/auth"
import {
  adminDashboardKpis,
  adminDashboardSeries,
  adminDashboardStatusDist,
  adminDashboardTopStores
} from "../controllers/dashboardController"

const router = Router()

// ทุก endpoint ต้องมีสิทธิ์ REPORT.READ
router.get("/kpis",
  // requirePerms("REPORT.READ"),
  adminDashboardKpis
)
router.get("/series",
  // requirePerms("REPORT.READ"),
  adminDashboardSeries
)
router.get("/status-dist",
  // requirePerms("REPORT.READ"),
  adminDashboardStatusDist
)
router.get("/top-stores",
  // requirePerms("REPORT.READ"),
  adminDashboardTopStores
)

export default router
