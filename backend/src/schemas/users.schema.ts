import { z } from "zod";

const indianPhone = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").optional(),
  phone: indianPhone.optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const notificationPreferencesSchema = z.object({
  emailLeadAlerts: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  whatsappUpdates: z.boolean().optional(),
  smsAlerts: z.boolean().optional(),
});
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

// First-time-signup wizard (Google OAuth only — see oauth/callback's onboardingCompleted check).
export const completeOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120).optional(),
  phone: indianPhone.optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  preferredCity: z.string().trim().max(120).optional(),
  preferredCategories: z.array(z.string().trim().max(120)).max(3).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode").optional().or(z.literal("")),
  referralSource: z.enum(["social", "friend", "search", "ad", "other"]).optional(),
});
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

export const saveBusinessSchema = z.object({
  listingId: z.string().min(1, "listingId is required"),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  imageUrl: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
});
export type SaveBusinessInput = z.infer<typeof saveBusinessSchema>;

export const saveSearchSchema = z.object({
  label: z.string().trim().min(1, "Give this search a name").max(120),
  keyword: z.string().trim().max(200).optional(),
  category: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
});
export type SaveSearchInput = z.infer<typeof saveSearchSchema>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export const removePushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
});
