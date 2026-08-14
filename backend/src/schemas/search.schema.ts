import { z } from "zod";

const csv = () => z.string().transform((s) => s.split(",").map((v) => v.trim()).filter(Boolean));

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(120).optional(),
  subcategory: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  locality: z.string().trim().max(120).optional(),
  area: z.string().trim().max(120).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(200).optional(),
  openNow: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  price: csv().pipe(z.enum(["budget", "moderate", "premium", "luxury"]).array()).optional(),
  amenities: csv().optional(),
  offers: z.coerce.boolean().optional(),
  tier: csv().pipe(z.enum(["basic", "premium", "elite"]).array()).optional(),
  sort: z
    .enum(["best_match", "distance", "rating", "reviews", "newest", "alphabetical"])
    .default("best_match"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
});
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

export const suggestionsQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(10).default(8),
});

export const compareQuerySchema = z.object({
  slugs: z
    .string()
    .transform((s) => s.split(",").map((v) => v.trim()).filter(Boolean))
    .pipe(z.string().array().min(2, "Compare at least 2 businesses").max(3, "Compare at most 3 businesses")),
});

export const compareNearbyQuerySchema = z.object({
  subcategory: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  limit: z.coerce.number().int().min(1).max(5).default(5),
}).refine((v) => v.subcategory || v.category, {
  message: "subcategory or category is required",
  path: ["subcategory"],
});
