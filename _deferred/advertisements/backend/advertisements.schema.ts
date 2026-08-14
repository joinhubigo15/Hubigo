import { z } from "zod";

// Originally lived in backend/src/schemas/admin.schema.ts — pulled out here alongside the rest
// of the deferred advertisements feature. Restore by pasting back into admin.schema.ts.

export const createAdvertisementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  targetCityId: z.string().uuid().optional(),
  placement: z.enum(["HOME_BANNER", "CATEGORY_TOP", "SEARCH_SPONSORED"]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;

export const updateAdvertisementSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  targetCityId: z.string().uuid().nullable().optional(),
  placement: z.enum(["HOME_BANNER", "CATEGORY_TOP", "SEARCH_SPONSORED"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ENDED"]).optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});
export type UpdateAdvertisementInput = z.infer<typeof updateAdvertisementSchema>;

export const trackAdvertisementSchema = z.object({
  type: z.enum(["impression", "click"]),
});
export type TrackAdvertisementInput = z.infer<typeof trackAdvertisementSchema>;
