import { Router } from "express"
import {
  adminListStores, adminSuggestStores, adminGetStoreDetail
} from "../controllers/userStoreController"

const router = Router()

// Stores (Merchants)
router.get("/list", adminListStores)
router.get("/suggest", adminSuggestStores)
router.get("/:id/detail", adminGetStoreDetail)

export default router
