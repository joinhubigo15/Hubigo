import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import { listUsers, suspendUser, activateUser } from "../../services/admin/users.service";
import { listUsersQuerySchema } from "../../schemas/admin.schema";

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await listUsers(query);
  return sendSuccess(res, 200, "Users", result);
});

export const postSuspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await suspendUser(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "user_suspended", "User", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "User suspended", user);
});

export const postActivateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await activateUser(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "user_activated", "User", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "User activated", user);
});
