import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import {
  submitClaimDocument,
  getClaimStatus,
  getOwnedBusiness,
  listOwnedBusinesses,
} from "../services/claims.service";
import { claimDocumentSchema } from "../schemas/claims.schema";

export const postClaimDocument = asyncHandler(async (req: Request, res: Response) => {
  const input = claimDocumentSchema.parse(req.body);
  if (!req.file) throw ApiError.badRequest("Please attach a business proof document");
  const claim = await submitClaimDocument(req.params.businessId, req.auth!.id, input, req.file);
  return sendSuccess(res, 201, "Claim submitted for admin review", claim);
});

export const getClaimStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const status = await getClaimStatus(req.params.businessId);
  return sendSuccess(res, 200, "Claim status", status);
});

export const getMyBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await getOwnedBusiness(req.auth!.id);
  return sendSuccess(res, 200, "Owned business", business);
});

export const getMyBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const businesses = await listOwnedBusinesses(req.auth!.id);
  return sendSuccess(res, 200, "Owned businesses", businesses);
});
