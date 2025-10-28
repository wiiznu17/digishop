import express from "express"
import {
  adminListStores, adminSuggestStores, adminGetStoreDetail,
  adminApproveStore
} from "../controllers/storeController"
import { requirePerms } from "../middlewares/auth"

const router: express.Router = express.Router();

// Stores (Merchants)
router.get("/list",
  requirePerms("MERCHANTS_READ"),
  adminListStores
)

router.get("/suggest",
  requirePerms("MERCHANTS_READ"),
  adminSuggestStores
)

router.get("/:id/detail",
  requirePerms("MERCHANTS_READ"),
  adminGetStoreDetail
)

router.post(
  "/:id/approve",
  requirePerms("MERCHANTS_APPROVE"),
  adminApproveStore
)
export default router
