import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import {
  listEditSuggestions,
  resolveEditSuggestion,
  deleteEditSuggestion,
  listListingReports,
  resolveListingReport,
  deleteListingReport,
} from "../../services/admin/listing-feedback.service";
import { listFeedbackQuerySchema, resolveFeedbackSchema } from "../../schemas/admin.schema";

export const getEditSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const query = listFeedbackQuerySchema.parse(req.query);
  const result = await listEditSuggestions(query);
  return sendSuccess(res, 200, "Edit suggestions", result);
});

export const postResolveEditSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { status } = resolveFeedbackSchema.parse(req.body);
  await resolveEditSuggestion(req.params.id, status);
  return sendSuccess(res, 200, "Edit suggestion updated", null);
});

export const deleteEditSuggestionHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteEditSuggestion(req.params.id);
  return sendSuccess(res, 200, "Edit suggestion deleted", { id: req.params.id });
});

export const getListingReports = asyncHandler(async (req: Request, res: Response) => {
  const query = listFeedbackQuerySchema.parse(req.query);
  const result = await listListingReports(query);
  return sendSuccess(res, 200, "Listing reports", result);
});

export const postResolveListingReport = asyncHandler(async (req: Request, res: Response) => {
  const { status } = resolveFeedbackSchema.parse(req.body);
  await resolveListingReport(req.params.id, status);
  return sendSuccess(res, 200, "Report updated", null);
});

export const deleteListingReportHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteListingReport(req.params.id);
  return sendSuccess(res, 200, "Report deleted", { id: req.params.id });
});
