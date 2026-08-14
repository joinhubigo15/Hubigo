import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { getPseoCandidates } from "../services/pseo.service";

export const getSitemapEntries = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await getPseoCandidates();
  return sendSuccess(res, 200, "pSEO sitemap candidates", candidates);
});
