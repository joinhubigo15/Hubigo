import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import {
  listCategories,
  listCities,
  listLocalitiesForCity,
  getAreaBySlug,
  listAmenities,
  resolveLocalAddress,
  listActiveOffers,
  getPlatformStats,
  getPopularByCategory,
} from "../services/taxonomy.service";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();
  return sendSuccess(res, 200, "Categories", categories);
});

export const getCities = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await listCities();
  return sendSuccess(res, 200, "Cities", cities);
});

export const getLocalities = asyncHandler(async (req: Request, res: Response) => {
  const citySlug = req.params.citySlug;
  if (!citySlug) throw ApiError.badRequest("citySlug is required");
  const localities = await listLocalitiesForCity(citySlug);
  return sendSuccess(res, 200, "Localities", localities);
});

export const getArea = asyncHandler(async (req: Request, res: Response) => {
  const { citySlug, areaSlug } = req.params;
  if (!citySlug || !areaSlug) throw ApiError.badRequest("citySlug and areaSlug are required");
  const area = await getAreaBySlug(citySlug, areaSlug);
  if (!area) throw ApiError.notFound("Area not found");
  return sendSuccess(res, 200, "Area", area);
});

export const getAmenities = asyncHandler(async (_req: Request, res: Response) => {
  const amenities = await listAmenities();
  return sendSuccess(res, 200, "Amenities", amenities);
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getPlatformStats();
  return sendSuccess(res, 200, "Platform stats", stats);
});

export const getOffers = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 3, 12);
  const offers = await listActiveOffers(limit);
  return sendSuccess(res, 200, "Active offers", offers);
});

export const getPopular = asyncHandler(async (req: Request, res: Response) => {
  const limitPerCategory = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);
  const groups = await getPopularByCategory(limitPerCategory);
  return sendSuccess(res, 200, "Popular businesses by category", groups);
});

export const getGeocodeLocal = asyncHandler(async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (!q.trim()) throw ApiError.badRequest("q is required");
  const result = await resolveLocalAddress(q);
  if (!result) throw ApiError.notFound("We don't cover that location yet — try an area or pincode in Bangalore, Chennai, or Hyderabad.");
  return sendSuccess(res, 200, "Resolved location", result);
});
