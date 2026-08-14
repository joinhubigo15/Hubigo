import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getDashboardMetrics } from "../../services/admin/dashboard.service";

export const getMetrics = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await getDashboardMetrics();
  return sendSuccess(res, 200, "Dashboard metrics", metrics);
});
