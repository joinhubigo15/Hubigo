import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import { listReviews, approveReview, flagReview, markReviewSpam, deleteReview } from "../../services/admin/reviews.service";
import { listReviewsQuerySchema, flagReviewSchema } from "../../schemas/admin.schema";

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const query = listReviewsQuerySchema.parse(req.query);
  const result = await listReviews(query);
  return sendSuccess(res, 200, "Reviews", result);
});

export const postApproveReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await approveReview(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "review_approved", "Review", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Review approved", review);
});

export const postFlagReview = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = flagReviewSchema.parse(req.body);
  const review = await flagReview(req.params.id, reason);
  await writeAdminAudit(req.adminAuth!.id, "review_flagged", "Review", req.params.id, adminAuditReqMeta(req), { reason });
  return sendSuccess(res, 200, "Review flagged", review);
});

export const postSpamReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await markReviewSpam(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "review_marked_spam", "Review", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Review marked as spam", review);
});

export const deleteReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteReview(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "review_deleted", "Review", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Review deleted", { id: req.params.id });
});
