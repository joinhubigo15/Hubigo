import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import {
  listBusinesses,
  verifyBusiness,
  unverifyBusiness,
  updateBusinessStatus,
  deleteBusiness,
} from "../../services/admin/businesses.service";
import { listBusinessesQuerySchema, updateBusinessStatusSchema } from "../../schemas/admin.schema";

export const getBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const query = listBusinessesQuerySchema.parse(req.query);
  const result = await listBusinesses(query);
  return sendSuccess(res, 200, "Businesses", result);
});

export const postVerifyBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await verifyBusiness(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "business_verified", "Business", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Business verified", business);
});

export const postUnverifyBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await unverifyBusiness(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "business_unverified", "Business", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Business unverified", business);
});

export const patchBusinessStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = updateBusinessStatusSchema.parse(req.body);
  const business = await updateBusinessStatus(req.params.id, status);
  await writeAdminAudit(req.adminAuth!.id, "business_status_changed", "Business", req.params.id, adminAuditReqMeta(req), {
    status,
  });
  return sendSuccess(res, 200, "Business status updated", business);
});

export const deleteBusinessHandler = asyncHandler(async (req: Request, res: Response) => {
  const business = await deleteBusiness(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "business_deleted", "Business", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Business deleted", business);
});
