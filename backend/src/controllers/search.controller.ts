import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { searchQuerySchema, suggestionsQuerySchema } from "../schemas/search.schema";
import { search } from "../services/search.service";
import { getSuggestions, getPopularSearches } from "../services/suggestions.service";

export const getSearch = asyncHandler(async (req: Request, res: Response) => {
  const input = searchQuerySchema.parse(req.query);
  const result = await search(input);
  return sendSuccess(res, 200, "Search results", result);
});

export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const input = suggestionsQuerySchema.parse(req.query);
  const suggestions = await getSuggestions(input.q, input.limit);
  return sendSuccess(res, 200, "Suggestions", suggestions);
});

export const getSearchPopular = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const popular = await getPopularSearches(limit);
  return sendSuccess(res, 200, "Popular searches", popular);
});

