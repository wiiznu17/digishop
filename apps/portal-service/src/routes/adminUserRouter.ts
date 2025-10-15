import express from "express";
import {
  adminListAdmins, adminSuggestAdmins, adminGetAdminDetail, adminCreateAdmin
} from "../controllers/adminUserController";
import {
  adminSendInviteById, adminResetPasswordById, adminAcceptInvite, adminPerformReset
} from "../controllers/adminCredentialController";
import { requirePerms } from "../middlewares/auth";
import { zodValidate } from "../lib/zod/validate";
import { IdParam } from "../lib/zod/schemas/credentialSchemas";
import { adminListRoles, adminUpdateAdminRoles } from "../controllers/changeRoleController";

const router: express.Router = express.Router();

// อ่าน/ค้นหา
router.get("/list",   requirePerms("ADMIN_USERS_READ"),   adminListAdmins);
router.get("/suggest",requirePerms("ADMIN_USERS_READ"),   adminSuggestAdmins);
router.get("/:id/detail", requirePerms("ADMIN_USERS_READ"), adminGetAdminDetail);

router.post("/create", requirePerms("ADMIN_USERS_CREATE"), adminCreateAdmin);
router.get("/roles/list", requirePerms("ADMIN_USERS_READ"), adminListRoles)
router.patch("/:id/roles",
  requirePerms("ADMIN_USERS_UPDATE"),
  zodValidate(IdParam, "params"),
  adminUpdateAdminRoles
)
router.post("/:id/invite",
  requirePerms("ADMIN_USERS_CREATE"),
  zodValidate(IdParam, "params"),
  adminSendInviteById
);

router.post("/:id/reset-password",
  requirePerms("ADMIN_USERS_UPDATE"),
  zodValidate(IdParam, "params"),
  adminResetPasswordById
);

export default router;
