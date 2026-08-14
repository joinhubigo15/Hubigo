import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as billingService from "../../services/business-dashboard/billing.service";
import { upgradeSubscriptionSchema } from "../../schemas/business-dashboard.schema";

export const getBilling = asyncHandler(async (req: Request, res: Response) => {
  const overview = await billingService.getBillingOverview(req.auth!.id);
  return sendSuccess(res, 200, "Billing overview", overview);
});

export const postUpgrade = asyncHandler(async (req: Request, res: Response) => {
  const { plan } = upgradeSubscriptionSchema.parse(req.body);
  const subscription = await billingService.upgradeSubscriptionMock(req.auth!.id, plan);
  return sendSuccess(res, 200, "Plan updated", subscription);
});
