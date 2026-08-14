import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { listLeads, deleteLead } from "../../services/admin/leads.service";
import { listLeadsQuerySchema } from "../../schemas/admin.schema";

export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const query = listLeadsQuerySchema.parse(req.query);
  const result = await listLeads(query);
  return sendSuccess(res, 200, "Leads", result);
});

export const deleteLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteLead(req.params.id);
  return sendSuccess(res, 200, "Lead deleted", { id: req.params.id });
});
