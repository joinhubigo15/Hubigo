import { z } from "zod";

const indianPhone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

// A listing is either in one of the seeded cities (cityId) or somewhere new the owner is
// self-listing from — in which case there's no cityId yet and newCityName/newCityState describe
// the city to auto-create (see create-business.service.ts).
export const createBusinessSchema = z
  .object({
    name: z.string().trim().min(2, "Business name is required").max(200),
    description: z.string().trim().max(2000).optional(),
    categoryId: z.string().uuid("Select a category"),
    cityId: z.string().uuid("Select a city").optional(),
    newCityName: z.string().trim().min(2).max(100).optional(),
    newCityState: z.string().trim().min(2).max(100).optional(),
    address: z.string().trim().min(5, "Enter a full address").max(500),
    pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode").optional(),
    phone: indianPhone,
    whatsappPhone: indianPhone.optional(),
    website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  })
  .refine((data) => data.cityId || (data.newCityName && data.newCityState), {
    message: "Select a city, or enter your city name and state",
    path: ["cityId"],
  });
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export const suggestEditSchema = z.object({
  type: z.string().trim().min(1).max(120),
  details: z.string().trim().min(1).max(2000),
});
export type SuggestEditInput = z.infer<typeof suggestEditSchema>;

export const reportListingSchema = z.object({
  reason: z.string().trim().min(1).max(120),
  details: z.string().trim().min(1).max(2000),
});
export type ReportListingInput = z.infer<typeof reportListingSchema>;
