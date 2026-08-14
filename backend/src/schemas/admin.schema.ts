import { z } from "zod";

// ── Shared pagination ───────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

// ── Businesses ───────────────────────────────────────────────────────────────

export const listBusinessesQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  verified: z.coerce.boolean().optional(),
  claimed: z.coerce.boolean().optional(),
});
export type ListBusinessesQuery = z.infer<typeof listBusinessesQuerySchema>;

export const updateBusinessStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});
export type UpdateBusinessStatusInput = z.infer<typeof updateBusinessStatusSchema>;

// ── Users ────────────────────────────────────────────────────────────────────

export const listUsersQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["user", "business_owner", "admin", "super_admin"]).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// ── Reviews ──────────────────────────────────────────────────────────────────

export const listReviewsQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "APPROVED", "FLAGGED", "SPAM", "REJECTED"]).optional(),
});
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

export const flagReviewSchema = z.object({
  reason: z.string().trim().min(1).max(300),
});
export type FlagReviewInput = z.infer<typeof flagReviewSchema>;

// ── Leads ────────────────────────────────────────────────────────────────────

export const listLeadsQuerySchema = paginationSchema.extend({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]).optional(),
  type: z.enum(["CALL", "EMAIL", "WHATSAPP", "FORM"]).optional(),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

// ── Contact Messages ─────────────────────────────────────────────────────────

export const listContactMessagesQuerySchema = paginationSchema.extend({
  isRead: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type ListContactMessagesQuery = z.infer<typeof listContactMessagesQuerySchema>;

// ── Business Edit Suggestions / Listing Reports ─────────────────────────────

export const listFeedbackQuerySchema = paginationSchema.extend({
  status: z.string().trim().optional(),
});
export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>;

export const resolveFeedbackSchema = z.object({
  status: z.enum(["applied", "dismissed", "resolved"]),
});
export type ResolveFeedbackInput = z.infer<typeof resolveFeedbackSchema>;

// ── Subscriptions ────────────────────────────────────────────────────────────

export const listSubscriptionsQuerySchema = paginationSchema.extend({
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "TRIAL"]).optional(),
  plan: z.enum(["FREE", "PRO", "PREMIUM", "ENTERPRISE"]).optional(),
});
export type ListSubscriptionsQuery = z.infer<typeof listSubscriptionsQuerySchema>;

// ── Imports ──────────────────────────────────────────────────────────────────

export const createImportJobSchema = z.object({
  sector: z.string().trim().max(120).optional(),
});
export type CreateImportJobInput = z.infer<typeof createImportJobSchema>;

// ── Categories / Subcategories ──────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  icon: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createSubcategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  parentId: z.string().uuid(),
  icon: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
});
export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;

export const updateSubcategorySchema = createSubcategorySchema.partial().extend({
  parentId: z.string().uuid().optional(),
});
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;

// ── Cities / Areas ───────────────────────────────────────────────────────────

export const createCitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  tier: z.string().trim().max(20).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});
export type CreateCityInput = z.infer<typeof createCitySchema>;

export const updateCitySchema = createCitySchema.partial().extend({
  tier: z.string().trim().max(20).nullable().optional(),
});
export type UpdateCityInput = z.infer<typeof updateCitySchema>;

export const listAreasQuerySchema = z.object({
  cityId: z.string().uuid().optional(),
});
export type ListAreasQuery = z.infer<typeof listAreasQuerySchema>;

export const createAreaSchema = z.object({
  cityId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  pincode: z.string().trim().max(10).optional(),
});
export type CreateAreaInput = z.infer<typeof createAreaSchema>;

export const updateAreaSchema = createAreaSchema.partial();
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;

// ── Audit logs ───────────────────────────────────────────────────────────────

export const listAuditLogsQuerySchema = paginationSchema.extend({
  action: z.string().trim().max(120).optional(),
  adminId: z.string().uuid().optional(),
});
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

// ── Admin team ───────────────────────────────────────────────────────────────

// Same complexity rules as auth.schema.ts's `password` — reused verbatim so admin-created
// accounts are held to the same bar as consumer accounts.
const adminPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const createAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: adminPassword,
  roleId: z.string().uuid(),
});
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;

export const updateAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  roleId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
});
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;

// ── Admin roles ──────────────────────────────────────────────────────────────

export const createAdminRoleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(z.string().trim().min(1)).max(200),
});
export type CreateAdminRoleInput = z.infer<typeof createAdminRoleSchema>;

export const updateAdminRoleSchema = createAdminRoleSchema.partial();
export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>;
