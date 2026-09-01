import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { getPseoCandidates, resolveTopSearchQuery, getAllBusinessSlugsForSitemap } from "../services/pseo.service";

export const getSitemapEntries = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await getPseoCandidates();
  return sendSuccess(res, 200, "pSEO sitemap candidates", candidates);
});

export const getResolveSearch = asyncHandler(async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const path = q ? await resolveTopSearchQuery(q) : null;
  return sendSuccess(res, 200, "Resolved search", { path });
});

export const getBusinessSlugs = asyncHandler(async (_req: Request, res: Response) => {
  const slugs = await getAllBusinessSlugsForSitemap();
  return sendSuccess(res, 200, "Business sitemap slugs", slugs);
});
