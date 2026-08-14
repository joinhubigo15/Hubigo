import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { listAllClaims, approveClaim, rejectClaim } from "../services/claims.service";
import { reviewSchema } from "../schemas/claims.schema";
import { writeAdminAudit, adminAuditReqMeta } from "../lib/admin-audit";

export const getAllClaims = asyncHandler(async (_req: Request, res: Response) => {
  const claims = await listAllClaims();
  return sendSuccess(res, 200, "Business claims", claims);
});

export const postApproveClaim = asyncHandler(async (req: Request, res: Response) => {
  const business = await approveClaim(req.params.claimId, req.adminAuth!.id);
  await writeAdminAudit(
    req.adminAuth!.id,
    "claim_approved",
    "BusinessClaim",
    req.params.claimId,
    adminAuditReqMeta(req),
  );
  return sendSuccess(res, 200, "Claim approved — ownership assigned", business);
});

export const postRejectClaim = asyncHandler(async (req: Request, res: Response) => {
  const { adminNotes } = reviewSchema.parse(req.body);
  const claim = await rejectClaim(req.params.claimId, req.adminAuth!.id, adminNotes);
  await writeAdminAudit(
    req.adminAuth!.id,
    "claim_rejected",
    "BusinessClaim",
    req.params.claimId,
    adminAuditReqMeta(req),
    { adminNotes },
  );
  return sendSuccess(res, 200, "Claim rejected", claim);
});
