import express from 'express'
import { authenticate, requireApprovedStore } from '../middlewares/middleware'
import { attachStore } from '../middlewares/storeMiddleware'
import { getDashboardSummary } from '../controllers/dashboardController'

const router: express.Router = express.Router()

// เหมือนโครง orders: เฉพาะหน้าเว็บ (cookie-JWT)
router.get(
  '/',
  authenticate,
  requireApprovedStore(),
  attachStore(),
  getDashboardSummary
)
// router.get("/revenue-series", authenticate, requireApprovedStore(), getRevenueSeries)
// router.get("/recent-sales", authenticate, requireApprovedStore(), getRecentSales)

export default router
