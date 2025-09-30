import { Router } from "express"
// import { authenticate } from "../middlewares/authenticate"
import * as ctrl from "../controllers/categoryController"
import { requirePerms } from "../middlewares/auth"

const router = Router()

router.get("/list",
  requirePerms("CATEGORIES_READ"),
  ctrl.listCategories
)

router.get("/suggest",
  requirePerms("CATEGORIES_READ"),
  ctrl.suggestCategories
)

router.get("/:uuid",
  requirePerms("CATEGORIES_READ"),
  ctrl.getCategoryDetail
)

router.post("/",
  requirePerms("CATEGORIES_CREATE"),
  ctrl.createCategory
)

router.patch("/:uuid",
  requirePerms("CATEGORIES_UPDATE"),
  ctrl.updateCategory
)

router.delete("/:uuid", 
  requirePerms("CATEGORIES_DELETE"),
  ctrl.deleteCategory
)

router.post("/:uuid/move-products",
  requirePerms("CATEGORIES_UPDATE, PRODUCTS_UPDATE"),
  ctrl.moveProducts
)

export default router
