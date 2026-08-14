import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getAnalytics } from "../../services/admin/analytics.service";

export const getAnalyticsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getAnalytics();
  return sendSuccess(res, 200, "Analytics", analytics);
});
