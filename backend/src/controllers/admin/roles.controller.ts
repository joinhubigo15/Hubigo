import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import { listAdminRoles, createAdminRole, updateAdminRole, deleteAdminRole } from "../../services/admin/roles.service";
import { createAdminRoleSchema, updateAdminRoleSchema } from "../../schemas/admin.schema";

export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await listAdminRoles();
  return sendSuccess(res, 200, "Admin roles", roles);
});

export const postRole = asyncHandler(async (req: Request, res: Response) => {
  const input = createAdminRoleSchema.parse(req.body);
  const role = await createAdminRole(input);
  await writeAdminAudit(req.adminAuth!.id, "admin_role_created", "AdminRole", role.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 201, "Role created", role);
});

export const patchRole = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAdminRoleSchema.parse(req.body);
  const role = await updateAdminRole(req.params.id, input);
  await writeAdminAudit(req.adminAuth!.id, "admin_role_updated", "AdminRole", req.params.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 200, "Role updated", role);
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await deleteAdminRole(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "admin_role_deleted", "AdminRole", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Role deleted", { id: req.params.id });
});
