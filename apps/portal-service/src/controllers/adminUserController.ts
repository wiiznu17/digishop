import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminUserService } from "../services/adminUserService";

export const adminListAdmins: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminUserService.listAdmins(req.query as Record<string, string | undefined>);
  res.json(result);
});

export const adminSuggestAdmins: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminUserService.suggestAdmins(req.query.q as string);
  res.json(result);
});

export const adminGetAdminDetail: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await adminUserService.getAdminDetail(id);
  res.json(result);
});

export const adminCreateAdmin: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminUserService.createAdmin(req.body ?? {});
  res.json(result);
});
