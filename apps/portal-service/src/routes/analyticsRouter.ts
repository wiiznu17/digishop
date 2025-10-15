import express from "express"
import { requirePerms } from "../middlewares/auth"
import {
  anaKpis,
  anaTrends,
  anaStatusDist,
  anaStoreLeaderboard,
} from "../controllers/analyticsController"

const router: express.Router = express.Router();
router.get("/kpis",        
  // requirePerms("REPORT.READ"),
  anaKpis
)
router.get("/trends",
  // requirePerms("REPORT.READ"),
  anaTrends
)
router.get("/status-dist",
  // requirePerms("REPORT.READ"),
  anaStatusDist
)
router.get("/stores",
  // requirePerms("REPORT.READ"),
  anaStoreLeaderboard
)

export default router
