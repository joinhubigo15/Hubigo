import { z } from "zod";

// ── Profile ──────────────────────────────────────────────────────────────

export const updateBusinessProfileSchema = z.object({
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number").optional(),
  whatsappPhone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number").optional(),
  website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  address: z.string().trim().min(5).max(500).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode").optional(),
  priceRange: z.enum(["budget", "moderate", "premium", "luxury"]).optional(),
});
export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;

const dayOfWeek = z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

export const updateHoursSchema = z.object({
  hours: z
    .array(
      z.object({
        day: dayOfWeek,
        openTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
        closeTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
        isClosed: z.boolean(),
      }),
    )
    .min(1)
    .max(7),
});
export type UpdateHoursInput = z.infer<typeof updateHoursSchema>;

export const updateAmenitiesSchema = z.object({
  amenityIds: z.array(z.string().uuid()).max(50),
});
export type UpdateAmenitiesInput = z.infer<typeof updateAmenitiesSchema>;

export const createAmenitySchema = z.object({
  name: z.string().trim().min(2).max(60),
});
export type CreateAmenityInput = z.infer<typeof createAmenitySchema>;

export const updateCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1, "Select at least one category").max(15),
});
export type UpdateCategoriesInput = z.infer<typeof updateCategoriesSchema>;

export const serviceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

// ── Offers ───────────────────────────────────────────────────────────────

export const offerSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).optional(),
  discountLabel: z.string().trim().max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type OfferInput = z.infer<typeof offerSchema>;

// ── Leads ────────────────────────────────────────────────────────────────

export const updateLeadStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
});
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

// ── Reviews ──────────────────────────────────────────────────────────────

export const replyToReviewSchema = z.object({
  reply: z.string().trim().min(1).max(1000),
});
export type ReplyToReviewInput = z.infer<typeof replyToReviewSchema>;

// ── Appointments ─────────────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  customerName: z.string().trim().min(1).max(150),
  customerPhone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  serviceName: z.string().trim().max(150).optional(),
  scheduledAt: z.coerce.date(),
  notes: z.string().trim().max(1000).optional(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
});
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ── Products ─────────────────────────────────────────────────────────────

// Products are submitted as multipart/form-data (to carry an optional image file alongside),
// so every field arrives as a string — z.coerce handles number/boolean the same way regardless
// of whether the request was JSON or multipart.
export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().min(0).max(10_000_000).optional(),
  category: z.string().trim().max(100).optional(),
  isAvailable: z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean()).optional(),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── Messages ─────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const startConversationSchema = z.object({
  customerName: z.string().trim().min(1).max(150),
  customerPhone: z.string().trim().regex(/^[6-9]\d{9}$/).optional(),
  body: z.string().trim().min(1).max(2000),
});
export type StartConversationInput = z.infer<typeof startConversationSchema>;

// ── Billing ──────────────────────────────────────────────────────────────

export const upgradeSubscriptionSchema = z.object({
  plan: z.enum(["FREE", "PRO", "PREMIUM", "ENTERPRISE"]),
});
export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>;
