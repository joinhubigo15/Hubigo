import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as reviewsService from "../../services/business-dashboard/reviews.service";
import { replyToReviewSchema } from "../../schemas/business-dashboard.schema";

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await reviewsService.listReviews(req.business!.id);
  return sendSuccess(res, 200, "Reviews", reviews);
});

export const postReviewReply = asyncHandler(async (req: Request, res: Response) => {
  const { reply } = replyToReviewSchema.parse(req.body);
  const review = await reviewsService.replyToReview(req.business!.id, req.params.reviewId, reply);
  return sendSuccess(res, 200, "Reply posted", review);
});
