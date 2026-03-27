import express from 'express'
import {
  adminListRoles,
  adminGetRoleDetail,
  adminCreateRole,
  adminUpdateRoleMeta,
  adminReplaceRolePermissions
} from '../controllers/adminRoleController'
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin'
import { requirePerms } from '../middlewares/auth'

const router: express.Router = express.Router()

router.get(
  '/list',
  // requireSuperAdmin,
  requirePerms('ROLES_READ'),
  adminListRoles
)

router.get(
  '/:id/detail',
  // requireSuperAdmin,
  requirePerms('ROLES_READ'),
  adminGetRoleDetail
)

router.post(
  '/create',
  // requireSuperAdmin,
  requirePerms('ROLES_CREATE'),
  adminCreateRole
)

router.patch(
  '/:id/meta',
  // requireSuperAdmin,
  requirePerms('ROLES_UPDATE'),
  adminUpdateRoleMeta
)

router.put(
  '/:id/permissions',
  // requireSuperAdmin,
  requirePerms('ROLES_ASSIGN'),
  adminReplaceRolePermissions
)

export default router
