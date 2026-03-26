import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminCredentialService } from "../services/adminCredentialService";

export const adminSendInviteById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const inviterId = (req as any)?.adminId;
  const result = await adminCredentialService.sendInviteById(id, inviterId);
  res.json(result);
});

export const adminResetPasswordById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await adminCredentialService.resetPasswordById(id);
  res.json(result);
});

export const adminAcceptInvite: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminCredentialService.acceptInvite(req.body ?? {});
  res.json(result);
});

export const adminPerformReset: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminCredentialService.performReset(req.body ?? {});
  res.json(result);
});
