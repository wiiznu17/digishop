import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { auditLogService } from "../services/auditLogService";

export const adminListAuditLogs: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await auditLogService.listAuditLogs(req.query as Record<string, string | undefined>);
  res.json(result);
});

export const adminSuggestAuditLogs: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await auditLogService.suggestAuditLogs(req.query.q as string);
  res.json(result);
});

export const adminGetAuditLogDetail: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await auditLogService.getAuditLogDetail(id);
  res.json(result);
});
