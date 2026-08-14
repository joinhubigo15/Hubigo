import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import {
  listAdminTeam,
  createAdminTeamMember,
  updateAdminTeamMember,
  deactivateAdminTeamMember,
} from "../../services/admin/team.service";
import { createAdminUserSchema, updateAdminUserSchema } from "../../schemas/admin.schema";

export const getTeam = asyncHandler(async (_req: Request, res: Response) => {
  const team = await listAdminTeam();
  return sendSuccess(res, 200, "Admin team", team);
});

export const postTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const input = createAdminUserSchema.parse(req.body);
  const admin = await createAdminTeamMember(input);
  await writeAdminAudit(req.adminAuth!.id, "admin_user_created", "AdminUser", admin.id, adminAuditReqMeta(req), {
    email: input.email,
    roleId: input.roleId,
  });
  return sendSuccess(res, 201, "Admin user created", admin);
});

export const patchTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAdminUserSchema.parse(req.body);
  const admin = await updateAdminTeamMember(req.params.id, input);
  await writeAdminAudit(req.adminAuth!.id, "admin_user_updated", "AdminUser", req.params.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 200, "Admin user updated", admin);
});

export const deleteTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const admin = await deactivateAdminTeamMember(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "admin_user_deactivated", "AdminUser", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Admin user deactivated", admin);
});
