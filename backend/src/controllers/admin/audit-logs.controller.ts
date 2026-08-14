import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { listAuditLogs } from "../../services/admin/audit-logs.service";
import { listAuditLogsQuerySchema } from "../../schemas/admin.schema";

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = listAuditLogsQuerySchema.parse(req.query);
  const result = await listAuditLogs(query);
  return sendSuccess(res, 200, "Audit logs", result);
});
