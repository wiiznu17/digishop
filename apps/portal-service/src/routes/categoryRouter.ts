import { Router } from "express"
// import { authenticate } from "../middlewares/authenticate"
import * as ctrl from "../controllers/categoryController"

const router = Router()

router.get("/list", ctrl.listCategories)
router.get("/suggest", ctrl.suggestCategories)
router.get("/:uuid", ctrl.getCategoryDetail)
router.post("/", ctrl.createCategory)
router.patch("/:uuid", ctrl.updateCategory)
// router.patch("/:uuid/status", ctrl.patchCategoryStatus)
router.delete("/:uuid", ctrl.deleteCategory)
router.post("/:uuid/move-products", ctrl.moveProducts)

export default router
