import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { prisma } from "../lib/prisma";
import { incrementViewCount } from "../repositories/business.repository";
import { compareBusinesses, compareNearbyBusinesses } from "../services/compare.service";
import { compareQuerySchema, compareNearbyQuerySchema } from "../schemas/search.schema";
import { resolveImageUrl, resolveMediaUrl } from "../lib/storage/resolve-image-url";
import { computeOpenStatus, parseWeeklyHoursFromRaw } from "../utils/business-hours";
import { recordBusinessInteraction } from "../services/competitor-leads.service";
import { createReview } from "../services/reviews.service";
import { createReviewSchema } from "../schemas/reviews.schema";
import { createBusiness } from "../services/create-business.service";
import { createBusinessSchema, suggestEditSchema, reportListingSchema } from "../schemas/businesses.schema";
import { createEditSuggestion, createListingReport } from "../services/feedback.service";
import { NATIVE_RATING_ACTIVATION_THRESHOLD } from "../config/rating-thresholds";

export const postCreateBusiness = asyncHandler(async (req: Request, res: Response) => {
  const input = createBusinessSchema.parse(req.body);
  const business = await createBusiness(req.auth!.id, input);
  return sendSuccess(res, 201, "Business listing created", business);
});

export const getCompare = asyncHandler(async (req: Request, res: Response) => {
  const { slugs } = compareQuerySchema.parse(req.query);
  const lat = req.query.lat ? Number(req.query.lat) : undefined;
  const lng = req.query.lng ? Number(req.query.lng) : undefined;
  const result = await compareBusinesses(slugs, lat, lng);
  return sendSuccess(res, 200, "Comparison", result);
});

export const getCompareNearby = asyncHandler(async (req: Request, res: Response) => {
  const { subcategory, category, lat, lng, limit } = compareNearbyQuerySchema.parse(req.query);
  const result = await compareNearbyBusinesses(subcategory ?? category!, lat, lng, limit);
  return sendSuccess(res, 200, "Nearby comparison", result);
});

export const getBusinessBySlug = asyncHandler(async (req: Request, res: Response) => {
  const business = await prisma.business.findFirst({
    where: { slug: req.params.slug, deletedAt: null, status: "approved" },
    include: {
      city: true,
      locality: true,
      categories: { include: { category: true } },
      amenities: { include: { amenity: true } },
      services: true,
      hours: true,
      media: { orderBy: { sortOrder: "asc" } },
      offers: { where: { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] } },
      products: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });

  if (!business) throw ApiError.notFound("Business not found");

  const area = business.pincode
    ? await prisma.pincodeArea.findFirst({
        where: { pincode: business.pincode, cityId: business.cityId, isPrimary: true },
        select: { name: true },
      })
    : null;

  incrementViewCount(business.id).catch((err) =>
    console.error("[businesses] failed to increment view count:", err)
  );

  // Routes a "competitor lead" to the nearest 2 same-category paid businesses when the viewer
  // is logged in — fire-and-forget, never blocks or fails the page load.
  recordBusinessInteraction({ businessId: business.id, userId: req.auth?.id ?? null, type: "VIEW" }).catch((err) =>
    console.error("[businesses] failed to record competitor-lead interaction:", err)
  );

  const openStatus = computeOpenStatus(business.hours);
  // Only the source raw text tells us whether the structured hours below were scraped for every
  // day or inferred by replicating a single known day across the week (see business-hours.ts) —
  // that distinction doesn't survive into the structured BusinessHours rows themselves.
  const weeklyHours = parseWeeklyHoursFromRaw(business.openHoursRaw);

  // A business imported with 0 reviews has no imported rating to protect — once it earns enough
  // native reviews (already loaded above via the APPROVED `reviews` include, so this is free), its
  // badge switches from "no rating yet" to a live average of those. A business imported WITH a
  // real rating keeps that frozen snapshot untouched (see rating-thresholds.ts).
  const nativeReviewCount = business.reviews.length;
  const ratingIsNativelyActive = business.reviewCount === 0 && nativeReviewCount >= NATIVE_RATING_ACTIVATION_THRESHOLD;
  const effectiveAvgRating = business.reviewCount > 0
    ? business.avgRating
    : ratingIsNativelyActive
      ? business.reviews.reduce((sum, r) => sum + r.rating, 0) / nativeReviewCount
      : 0;
  const effectiveReviewCount = business.reviewCount > 0
    ? business.reviewCount
    : ratingIsNativelyActive
      ? nativeReviewCount
      : 0;

  const resolved = {
    ...business,
    areaName: area?.name ?? null,
    avgRating: effectiveAvgRating,
    reviewCount: effectiveReviewCount,
    coverImageUrl: resolveImageUrl(business.coverImageUrl),
    logoUrl: resolveImageUrl(business.logoUrl),
    media: business.media.map((m) => ({ ...m, url: resolveMediaUrl(m) ?? m.url })),
    products: business.products.map((p) => ({ ...p, imageUrl: resolveImageUrl(p.imageUrl) })),
    isOpenNow: openStatus.isOpenNow,
    closesAt: openStatus.closesAt,
    hoursInferredFromSingleDay: weeklyHours?.inferredFromSingleDay ?? false,
  };

  return sendSuccess(res, 200, "Business detail", resolved);
});

const trackInteractionSchema = z.object({
  type: z.enum(["CALL", "WHATSAPP"]),
});

// Fired by the frontend when a logged-in visitor clicks Call/WhatsApp on a business — same
// competitor-lead routing as a profile view, just triggered by a stronger intent signal.
// Anonymous visitors hit this too (optionalAuth) but no-op since there's no one to attribute it to.
export const postBusinessInteraction = asyncHandler(async (req: Request, res: Response) => {
  const { type } = trackInteractionSchema.parse(req.body);
  const business = await prisma.business.findFirst({
    where: { slug: req.params.slug, deletedAt: null, status: "approved" },
    select: { id: true },
  });
  if (!business) throw ApiError.notFound("Business not found");

  await recordBusinessInteraction({ businessId: business.id, userId: req.auth?.id ?? null, type });
  return sendSuccess(res, 200, "Interaction recorded", null);
});

// Publishes immediately — no admin moderation queue for customer-submitted reviews (explicit
// product decision). Admin moderation (flag/spam) still applies after the fact.
export const postBusinessReview = asyncHandler(async (req: Request, res: Response) => {
  const { rating, comment } = createReviewSchema.parse(req.body);
  const review = await createReview(req.params.businessId, req.auth!.id, rating, comment);
  return sendSuccess(res, 201, "Review posted", review);
});

export const postSuggestEdit = asyncHandler(async (req: Request, res: Response) => {
  const input = suggestEditSchema.parse(req.body);
  await createEditSuggestion(req.params.businessId, req.auth?.id ?? null, input);
  return sendSuccess(res, 200, "Edit suggestion received. Thank you!", null);
});

export const postReportListing = asyncHandler(async (req: Request, res: Response) => {
  const input = reportListingSchema.parse(req.body);
  await createListingReport(req.params.businessId, req.auth?.id ?? null, input);
  return sendSuccess(res, 200, "Report received. Our compliance team will audit this listing.", null);
});
