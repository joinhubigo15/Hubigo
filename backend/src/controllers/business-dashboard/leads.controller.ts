import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as leadsService from "../../services/business-dashboard/leads.service";
import { updateLeadStatusSchema } from "../../schemas/business-dashboard.schema";

export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const leads = await leadsService.listLeads(req.business!.id);
  return sendSuccess(res, 200, "Leads", leads);
});

export const patchLeadStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = updateLeadStatusSchema.parse(req.body);
  const lead = await leadsService.updateLeadStatus(req.business!.id, req.params.leadId, status);
  return sendSuccess(res, 200, "Lead status updated", lead);
});
