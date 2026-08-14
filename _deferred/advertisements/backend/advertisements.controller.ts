import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import {
  listAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  trackAdvertisement,
} from "../../services/admin/advertisements.service";
import {
  createAdvertisementSchema,
  updateAdvertisementSchema,
  trackAdvertisementSchema,
} from "../../schemas/admin.schema";

export const getAdvertisements = asyncHandler(async (_req: Request, res: Response) => {
  const ads = await listAdvertisements();
  return sendSuccess(res, 200, "Advertisements", ads);
});

export const postAdvertisement = asyncHandler(async (req: Request, res: Response) => {
  const input = createAdvertisementSchema.parse(req.body);
  const ad = await createAdvertisement(input);
  await writeAdminAudit(req.adminAuth!.id, "advertisement_created", "Advertisement", ad.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 201, "Advertisement created", ad);
});

export const patchAdvertisement = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAdvertisementSchema.parse(req.body);
  const ad = await updateAdvertisement(req.params.id, input);
  await writeAdminAudit(req.adminAuth!.id, "advertisement_updated", "Advertisement", req.params.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 200, "Advertisement updated", ad);
});

export const deleteAdvertisementHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteAdvertisement(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "advertisement_deleted", "Advertisement", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Advertisement deleted", { id: req.params.id });
});

export const postTrackAdvertisement = asyncHandler(async (req: Request, res: Response) => {
  const { type } = trackAdvertisementSchema.parse(req.body);
  const ad = await trackAdvertisement(req.params.id, type);
  return sendSuccess(res, 200, "Advertisement tracked", ad);
});
