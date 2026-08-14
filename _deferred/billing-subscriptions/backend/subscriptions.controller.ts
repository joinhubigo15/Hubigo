import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { listSubscriptions } from "../../services/admin/subscriptions.service";
import { listSubscriptionsQuerySchema } from "../../schemas/admin.schema";

export const getSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const query = listSubscriptionsQuerySchema.parse(req.query);
  const result = await listSubscriptions(query);
  return sendSuccess(res, 200, "Subscriptions", result);
});
