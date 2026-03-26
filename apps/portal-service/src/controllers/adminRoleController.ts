import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminRoleService } from "../services/adminRoleService";

export const adminListRoles: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminRoleService.listRoles(req.query as Record<string, string | undefined>);
  res.json(result);
});

export const adminGetRoleDetail: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await adminRoleService.getRoleDetail(id);
  res.json(result);
});

export const adminCreateRole: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminRoleService.createRole(req.body ?? {});
  res.json(result);
});

export const adminUpdateRoleMeta: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await adminRoleService.updateRoleMeta(id, req.body ?? {});
  res.json(result);
});

export const adminReplaceRolePermissions: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await adminRoleService.replaceRolePermissions(id, req.body ?? {});
  res.json(result);
});
