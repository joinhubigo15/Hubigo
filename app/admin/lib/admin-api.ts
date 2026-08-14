// Typed client for the Hubigo Admin Console. All calls go through the Next.js proxy route
// at /api/admin/data/* which reads the httpOnly `hubigo_admin_session` cookie server-side
// and forwards to the Express backend at /api/v1/admin/*. No bearer token is ever held
// client-side for admin auth — the cookie rides along automatically on same-origin fetches.

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; details?: unknown };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/data${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !body || !body.success) throw new Error(body?.message ?? "Something went wrong. Please try again.");
  return body.data;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`/api/admin/data${path}`, { method: "POST", body: formData, cache: "no-store" });
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !body || !body.success) throw new Error(body?.message ?? "Something went wrong. Please try again.");
  return body.data;
}

function qs(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Dashboard ────────────────────────────────────────────────────────────

export interface AdminDashboardMetrics {
  totalBusinesses: number;
  verifiedBusinesses: number;
  pendingClaims: number;
  pendingReviews: number;
  registeredUsers: number;
  activeBusinessOwners: number;
  monthlyRevenueInr: number;
}

export const getAdminDashboardMetrics = () => request<AdminDashboardMetrics>("/dashboard/metrics");

// ── Businesses ───────────────────────────────────────────────────────────

export interface AdminBusinessRow {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  subcategory: string | null;
  city: string;
  area: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  isVerified: boolean;
  isClaimed: boolean;
  planTier: string;
  rating: number;
  reviewsCount: number;
  status: string;
  createdAt: string;
}

export const getAdminBusinesses = (params?: {
  search?: string;
  city?: string;
  status?: string;
  verified?: boolean;
  claimed?: boolean;
  page?: number;
  pageSize?: number;
}) => request<Paginated<AdminBusinessRow>>(`/businesses${qs(params)}`);

export const verifyAdminBusiness = (id: string) => request(`/businesses/${id}/verify`, { method: "POST" });
export const unverifyAdminBusiness = (id: string) => request(`/businesses/${id}/unverify`, { method: "POST" });
export const updateAdminBusinessStatus = (id: string, status: string) =>
  request(`/businesses/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteAdminBusiness = (id: string) => request(`/businesses/${id}`, { method: "DELETE" });

// ── Claims ───────────────────────────────────────────────────────────────

export interface AdminClaim {
  id: string;
  businessId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  verificationMethod: string;
  contactPhone: string;
  contactEmail: string;
  docType: string;
  proofValue: string | null;
  proofUrl: string | null;
  proofFileName: string | null;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  user: { id: string; name: string; email: string | null; phone: string | null };
  business: { id: string; name: string; slug: string; city: { name: string } | null } | null;
}

export const getAdminClaims = () => request<AdminClaim[]>("/claims");
export const approveAdminClaim = (claimId: string) => request(`/claims/${claimId}/approve`, { method: "POST" });
export const rejectAdminClaim = (claimId: string, adminNotes?: string) =>
  request(`/claims/${claimId}/reject`, { method: "POST", body: JSON.stringify({ adminNotes }) });

// ── Users ────────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: "ACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  phoneVerified: boolean;
  businessesCount: number;
  createdAt: string;
  lastActiveAt: string | null;
}

export const getAdminUsers = (params?: { search?: string; status?: string; role?: string; page?: number; pageSize?: number }) =>
  request<Paginated<AdminUserRow>>(`/users${qs(params)}`);
export const suspendAdminUser = (id: string) => request(`/users/${id}/suspend`, { method: "POST" });
export const activateAdminUser = (id: string) => request(`/users/${id}/activate`, { method: "POST" });

// ── Reviews ──────────────────────────────────────────────────────────────

export interface AdminReviewRow {
  id: string;
  businessName: string;
  businessSlug: string;
  userName: string;
  userEmail: string | null;
  rating: number;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "FLAGGED" | "SPAM" | "REJECTED";
  flaggedReason: string | null;
  createdAt: string;
}

export const getAdminReviews = (params?: { status?: string; page?: number; pageSize?: number }) =>
  request<Paginated<AdminReviewRow>>(`/reviews${qs(params)}`);
export const approveAdminReview = (id: string) => request(`/reviews/${id}/approve`, { method: "POST" });
export const flagAdminReview = (id: string, reason: string) =>
  request(`/reviews/${id}/flag`, { method: "POST", body: JSON.stringify({ reason }) });
export const spamAdminReview = (id: string) => request(`/reviews/${id}/spam`, { method: "POST" });
export const deleteAdminReview = (id: string) => request<null>(`/reviews/${id}`, { method: "DELETE" });

// ── Leads ────────────────────────────────────────────────────────────────

export interface AdminLeadRow {
  id: string;
  businessName: string;
  type: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

export const getAdminLeads = (params?: { status?: string; type?: string; page?: number; pageSize?: number }) =>
  request<Paginated<AdminLeadRow>>(`/leads${qs(params)}`);

export const deleteAdminLead = (id: string) => request<null>(`/leads/${id}`, { method: "DELETE" });

// ── Contact Messages ─────────────────────────────────────────────────────────

export interface AdminContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; email: string | null; phone: string | null } | null;
}

export const getAdminContactMessages = (params?: { isRead?: boolean; page?: number; pageSize?: number }) =>
  request<Paginated<AdminContactMessageRow>>(
    `/contact-messages${qs({
      isRead: params?.isRead === undefined ? undefined : String(params.isRead),
      page: params?.page,
      pageSize: params?.pageSize,
    })}`
  );

export const markAdminContactMessageRead = (id: string) =>
  request<null>(`/contact-messages/${id}/read`, { method: "POST" });

export const deleteAdminContactMessage = (id: string) => request<null>(`/contact-messages/${id}`, { method: "DELETE" });

// ── Listing Feedback (Suggest an Edit / Report Listing, from a business page) ───────────────

export interface AdminListingFeedbackRow {
  id: string;
  businessId: string;
  business: { id: string; name: string; slug: string } | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null } | null;
}

export interface AdminEditSuggestionRow extends AdminListingFeedbackRow {
  type: string;
  details: string;
}

export interface AdminListingReportRow extends AdminListingFeedbackRow {
  reason: string;
  details: string;
}

export const getAdminEditSuggestions = (params?: { status?: string; page?: number; pageSize?: number }) =>
  request<Paginated<AdminEditSuggestionRow>>(`/edit-suggestions${qs(params)}`);

export const resolveAdminEditSuggestion = (id: string, status: "applied" | "dismissed") =>
  request<null>(`/edit-suggestions/${id}/resolve`, { method: "POST", body: JSON.stringify({ status }) });

export const deleteAdminEditSuggestion = (id: string) => request<null>(`/edit-suggestions/${id}`, { method: "DELETE" });

export const getAdminListingReports = (params?: { status?: string; page?: number; pageSize?: number }) =>
  request<Paginated<AdminListingReportRow>>(`/listing-reports${qs(params)}`);

export const resolveAdminListingReport = (id: string, status: "resolved" | "dismissed") =>
  request<null>(`/listing-reports/${id}/resolve`, { method: "POST", body: JSON.stringify({ status }) });

export const deleteAdminListingReport = (id: string) => request<null>(`/listing-reports/${id}`, { method: "DELETE" });


// ── Imports ──────────────────────────────────────────────────────────────

export interface AdminImportJob {
  id: string;
  filename: string;
  sector: string | null;
  totalRows: number;
  processedRows: number;
  insertedRows: number;
  duplicateRows: number;
  failedRows: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const getAdminImports = () => request<AdminImportJob[]>("/imports");
export const uploadAdminImport = (file: File, sector?: string) => {
  const fd = new FormData();
  fd.append("file", file);
  if (sector) fd.append("sector", sector);
  return requestForm<AdminImportJob>("/imports", fd);
};
export const retryAdminImport = (id: string) => request(`/imports/${id}/retry`, { method: "POST" });

// ── Categories ───────────────────────────────────────────────────────────

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  subcategoriesCount: number;
}

export const getAdminCategories = () => request<AdminCategory[]>("/categories");
export const createAdminCategory = (input: { name: string; slug: string; icon?: string; description?: string }) =>
  request<AdminCategory>("/categories", { method: "POST", body: JSON.stringify(input) });
export const updateAdminCategory = (id: string, input: Partial<{ name: string; slug: string; icon: string; description: string }>) =>
  request<AdminCategory>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteAdminCategory = (id: string) => request(`/categories/${id}`, { method: "DELETE" });

// ── Subcategories ────────────────────────────────────────────────────────

export interface AdminSubcategory {
  id: string;
  name: string;
  slug: string;
  sector: string;
  commonServices: string[];
  templatesCount: number;
}

export const getAdminSubcategories = () => request<AdminSubcategory[]>("/subcategories");
export const createAdminSubcategory = (input: { name: string; slug: string; parentId: string; icon?: string; description?: string }) =>
  request<AdminSubcategory>("/subcategories", { method: "POST", body: JSON.stringify(input) });
export const updateAdminSubcategory = (id: string, input: Partial<{ name: string; slug: string; parentId: string; icon: string; description: string }>) =>
  request<AdminSubcategory>(`/subcategories/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteAdminSubcategory = (id: string) => request(`/subcategories/${id}`, { method: "DELETE" });

// ── Cities ───────────────────────────────────────────────────────────────

export interface AdminCity {
  id: string;
  name: string;
  slug: string;
  state: string;
  tier: string | null;
  businessesCount: number;
  areasCount: number;
  isAutoCreated: boolean;
  autoCreatedAcknowledged: boolean;
}

export const getAdminCities = () => request<AdminCity[]>("/cities");
export const createAdminCity = (input: { name: string; slug: string; state: string; tier?: string; lat?: number; lng?: number }) =>
  request<AdminCity>("/cities", { method: "POST", body: JSON.stringify(input) });
export const updateAdminCity = (id: string, input: Partial<{ name: string; slug: string; state: string; tier: string; lat: number; lng: number }>) =>
  request<AdminCity>(`/cities/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const acknowledgeAdminCity = (id: string) => request<AdminCity>(`/cities/${id}/acknowledge`, { method: "POST" });
export const deleteAdminCity = (id: string) => request(`/cities/${id}`, { method: "DELETE" });

// ── Areas ────────────────────────────────────────────────────────────────

export interface AdminArea {
  id: string;
  name: string;
  city: string;
  pincode: string | null;
  businessesCount: number;
}

export const getAdminAreas = (params?: { cityId?: string }) => request<AdminArea[]>(`/areas${qs(params)}`);
export const createAdminArea = (input: { cityId: string; name: string; slug: string; pincode?: string }) =>
  request<AdminArea>("/areas", { method: "POST", body: JSON.stringify(input) });
export const updateAdminArea = (id: string, input: Partial<{ cityId: string; name: string; slug: string; pincode: string }>) =>
  request<AdminArea>(`/areas/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteAdminArea = (id: string) => request(`/areas/${id}`, { method: "DELETE" });

// ── Audit logs ───────────────────────────────────────────────────────────

export interface AdminAuditLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export const getAdminAuditLogs = (params?: { page?: number; pageSize?: number; action?: string; adminId?: string }) =>
  request<Paginated<AdminAuditLog>>(`/audit-logs${qs(params)}`);

// ── Admin team ───────────────────────────────────────────────────────────

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  roleName: string;
  roleSlug: string;
  status: "ACTIVE" | "SUSPENDED";
  lastLoginAt: string | null;
  isTwoFactorEnabled: boolean;
}

export interface CreateAdminTeamResult {
  id: string;
  name: string;
  email: string;
  roleName: string;
  roleSlug: string;
  status: "ACTIVE" | "SUSPENDED";
  lastLoginAt: string | null;
  isTwoFactorEnabled: boolean;
  note?: string;
}

export const getAdminTeam = () => request<AdminTeamMember[]>("/team");
export const createAdminTeamMember = (input: { name: string; email: string; password: string; roleId: string }) =>
  request<CreateAdminTeamResult>("/team", { method: "POST", body: JSON.stringify(input) });
export const updateAdminTeamMember = (id: string, input: Partial<{ name: string; roleId: string; status: string }>) =>
  request<AdminTeamMember>(`/team/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deactivateAdminTeamMember = (id: string) => request(`/team/${id}`, { method: "DELETE" });

// ── Roles ────────────────────────────────────────────────────────────────

export interface AdminRole {
  id: string;
  name: string;
  slug: string;
  description: string;
  adminsCount: number;
  permissions: string[];
}

export const getAdminRoles = () => request<AdminRole[]>("/roles");
export const createAdminRole = (input: { name: string; slug: string; description?: string; permissions: string[] }) =>
  request<AdminRole>("/roles", { method: "POST", body: JSON.stringify(input) });
export const updateAdminRole = (id: string, input: Partial<{ name: string; slug: string; description: string; permissions: string[] }>) =>
  request<AdminRole>(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteAdminRole = (id: string) => request(`/roles/${id}`, { method: "DELETE" });

// ── Settings (read-only) ─────────────────────────────────────────────────

export interface AdminSettings {
  environment: string;
  backendUrl: string;
  frontendUrl: string;
  database: { provider: string; poolLimit: number | null };
  storage: { r2Enabled: boolean; bucket: string | null; publicUrl: string | null };
  email: { enabled: boolean; from: string };
  featureFlags: { googleOAuthEnabled: boolean; adminAuthEnabled: boolean };
}

export const getAdminSettings = () => request<AdminSettings>("/settings");

// ── Analytics ────────────────────────────────────────────────────────────

export interface AdminAnalytics {
  totalSearches: number;
  totalProfileViews: number;
  totalLeads: number;
  claimConversionRate: number;
  topSubcategories: { name: string; count: number }[];
  topSubcategoriesSource: "search_logs" | "listing_counts";
  topCities: { name: string; count: number }[];
  topCitiesSource: "search_logs" | "listing_counts";
}

export const getAdminAnalytics = () => request<AdminAnalytics>("/analytics");
