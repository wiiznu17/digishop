import { Router } from "express"
// import { authenticate } from "../middlewares/authenticate"
import * as ctrl from "../controllers/categoryController"
import { requirePerms } from "../middlewares/auth"

const router = Router()

router.get("/list",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  ctrl.listCategories
)

router.get("/suggest",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  ctrl.suggestCategories
)

router.get("/:uuid",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  ctrl.getCategoryDetail
)

router.post("/",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  ctrl.createCategory
)

router.patch("/:uuid",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  ctrl.updateCategory
)

router.delete("/:uuid", 
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  ctrl.deleteCategory
)

router.post("/:uuid/move-products",
  requirePerms("PRODUCT.APPROVE","PRODUCT.UPDATE"),
  ctrl.moveProducts
)

export default router
