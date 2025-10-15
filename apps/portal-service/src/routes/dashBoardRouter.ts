import express from "express"
import { requirePerms } from "../middlewares/auth"
import {
  adminDashboardKpis,
  adminDashboardSeries,
  adminDashboardStatusDist,
  adminDashboardTopStores
} from "../controllers/dashboardController"

const router: express.Router = express.Router();

router.get("/kpis",
  requirePerms("DASHBOARD_VIEW"),
  adminDashboardKpis
)
router.get("/series",
  requirePerms("DASHBOARD_VIEW"),
  adminDashboardSeries
)
router.get("/status-dist",
  requirePerms("DASHBOARD_VIEW"),
  adminDashboardStatusDist
)
router.get("/top-stores",
  requirePerms("DASHBOARD_VIEW"),
  adminDashboardTopStores
)

export default router
