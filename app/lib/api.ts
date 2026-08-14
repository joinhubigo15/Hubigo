export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type Role = "user" | "business_owner" | "admin" | "super_admin";

export interface NotificationPreferences {
  emailLeadAlerts: boolean;
  emailMarketing: boolean;
  whatsappUpdates: boolean;
  smsAlerts: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  preferredCity: string | null;
  preferredCategories: string[];
  pincode: string | null;
  notificationPreferences: NotificationPreferences;
  createdAt: string;
}

export interface SavedBusiness {
  id: string;
  listingId: string;
  name: string;
  category: string | null;
  city: string | null;
  imageUrl: string | null;
  rating: number | null;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  label: string;
  keyword: string | null;
  category: string | null;
  city: string | null;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; details?: unknown };
}

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GET requests are idempotent, so a transient failure (cold backend DB connection pool, a brief
// network blip) is safe to retry silently — this is what stops page content from vanishing just
// because the backend hadn't warmed up yet. POST/PATCH/DELETE are deliberately never retried
// here: a request that succeeded server-side but failed to return a response could otherwise be
// silently repeated (e.g. a lead or a listing created twice).
const RETRY_DELAYS_MS = [400, 1000];

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  const isRetryable = !init.method || init.method.toUpperCase() === "GET";
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (isRetryable && res.status >= 500 && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      return res;
    } catch (err) {
      if (!isRetryable || attempt >= RETRY_DELAYS_MS.length) throw err;
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
}

export async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const res = await fetchWithRetry(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    credentials: "include",
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body || !body.success) {
    let message = body?.message ?? "Something went wrong. Please try again.";
    if (message === "Validation failed" && body?.error?.details && typeof body.error.details === "object") {
      const detailsObj = body.error.details as { fieldErrors?: Record<string, string[]> };
      if (detailsObj.fieldErrors) {
        const firstField = Object.keys(detailsObj.fieldErrors)[0];
        const firstErr = Object.values(detailsObj.fieldErrors).flat()[0];
        if (firstErr) {
          message = firstField ? `${firstField}: ${firstErr}` : firstErr;
        }
      }
    }
    throw new ApiClientError(
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      message,
      body?.error?.details
    );
  }

  return body.data;
}

async function requestForm<T>(
  path: string,
  method: string,
  formData: FormData,
  accessToken: string
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    body: formData,
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body || !body.success) {
    throw new ApiClientError(
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.message ?? "Something went wrong. Please try again.",
      body?.error?.details
    );
  }

  return body.data;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
}

export function refreshRequest() {
  return request<AuthSession>("/api/v1/auth/refresh", { method: "POST" });
}

export function logoutRequest() {
  return request<null>("/api/v1/auth/logout", { method: "POST" });
}

export function meRequest(accessToken: string) {
  return request<PublicUser>("/api/v1/auth/me", { accessToken });
}

export function verifyEmailRequest(token: string) {
  return request<PublicUser>("/api/v1/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerificationRequest(email: string) {
  return request<null>("/api/v1/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function googleOAuthUrl() {
  return `${API_URL}/api/v1/auth/google`;
}

// ── Profile ──────────────────────────────────────────────────────────────

export function updateProfileRequest(
  accessToken: string,
  input: { name?: string; email?: string; phone?: string }
) {
  return request<PublicUser>("/api/v1/users/me", {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(input),
  });
}

export function uploadAvatarRequest(accessToken: string, file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  return requestForm<PublicUser>("/api/v1/users/me/avatar", "PUT", formData, accessToken);
}

export function removeAvatarRequest(accessToken: string) {
  return request<PublicUser>("/api/v1/users/me/avatar", {
    method: "DELETE",
    accessToken,
  });
}

export function updateNotificationPreferencesRequest(
  accessToken: string,
  input: Partial<NotificationPreferences>
) {
  return request<PublicUser>("/api/v1/users/me/notifications", {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(input),
  });
}

export function completeOnboardingRequest(
  accessToken: string,
  input: {
    name?: string;
    phone?: string;
    notificationPreferences?: Partial<NotificationPreferences>;
    preferredCity?: string;
    preferredCategories?: string[];
    pincode?: string;
    referralSource?: "social" | "friend" | "search" | "ad" | "other";
  }
) {
  return request<PublicUser>("/api/v1/users/me/onboarding", {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export function getSavedBusinessesRequest(accessToken: string) {
  return request<SavedBusiness[]>("/api/v1/users/me/saved-businesses", { accessToken });
}

export function saveBusinessRequest(
  accessToken: string,
  input: {
    listingId: string;
    name: string;
    category?: string;
    city?: string;
    imageUrl?: string;
    rating?: number;
  }
) {
  return request<SavedBusiness>("/api/v1/users/me/saved-businesses", {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export function removeSavedBusinessRequest(accessToken: string, id: string) {
  return request<null>(`/api/v1/users/me/saved-businesses/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export function getSavedSearchesRequest(accessToken: string) {
  return request<SavedSearch[]>("/api/v1/users/me/saved-searches", { accessToken });
}

export function saveSearchRequest(
  accessToken: string,
  input: { label: string; keyword?: string; category?: string; city?: string }
) {
  return request<SavedSearch>("/api/v1/users/me/saved-searches", {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export function removeSavedSearchRequest(accessToken: string, id: string) {
  return request<null>(`/api/v1/users/me/saved-searches/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

// ── Business Verification System ────────────────────────────────────────────

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OwnedBusiness {
  id: string;
  slug: string;
  name: string;
  isClaimed: boolean;
  claimedAt: string | null;
  claimVerificationMethod: string | null;
  isVerified: boolean;
}

export interface ClaimStatus {
  isClaimed: boolean;
  claimedAt: string | null;
  claimVerificationMethod: string | null;
  latestClaim: {
    id: string;
    status: ApprovalStatus;
    verificationMethod: string;
    docType: string;
    proofValue: string | null;
    proofUrl: string | null;
    proofFileName: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
}

export function getMyBusinessRequest(accessToken: string) {
  return request<OwnedBusiness | null>("/api/v1/users/me/business", { accessToken });
}

export interface MyClaim {
  id: string;
  businessId: string;
  status: ApprovalStatus;
  docType: string;
  proofValue: string | null;
  proofFileName: string | null;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  business: { id: string; name: string; slug: string; city: { name: string } | null } | null;
}

export function getMyClaimsRequest(accessToken: string) {
  return request<MyClaim[]>("/api/v1/users/me/claims", { accessToken });
}

// ── Contact Us ───────────────────────────────────────────────────────────────

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function submitContactMessageRequest(accessToken: string, input: ContactMessageInput) {
  return request<{ id: string }>("/api/v1/contact", {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

// ── In-App Notifications ────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export function getNotificationsRequest(accessToken: string) {
  return request<AppNotification[]>("/api/v1/users/me/notifications", { accessToken });
}

export function markNotificationReadRequest(accessToken: string, id: string) {
  return request<null>(`/api/v1/users/me/notifications/${id}/read`, { method: "PATCH", accessToken });
}

export function markAllNotificationsReadRequest(accessToken: string) {
  return request<null>("/api/v1/users/me/notifications/read-all", { method: "PATCH", accessToken });
}

export function clearAllNotificationsRequest(accessToken: string) {
  return request<null>("/api/v1/users/me/notifications", { method: "DELETE", accessToken });
}

// ── Push Notifications ────────────────────────────────────────────────────

export function subscribeToPushRequest(accessToken: string, subscription: PushSubscriptionJSON) {
  return request<null>("/api/v1/users/me/push-subscriptions", {
    method: "POST",
    accessToken,
    body: JSON.stringify(subscription),
  });
}

export function unsubscribeFromPushRequest(accessToken: string, endpoint: string) {
  return request<null>("/api/v1/users/me/push-subscriptions", {
    method: "DELETE",
    accessToken,
    body: JSON.stringify({ endpoint }),
  });
}

export interface CreateBusinessInput {
  name: string;
  description?: string;
  categoryId: string;
  // Either an existing city (cityId) or a new one to auto-create (newCityName + newCityState) —
  // see backend/src/services/create-business.service.ts.
  cityId?: string;
  newCityName?: string;
  newCityState?: string;
  address: string;
  pincode?: string;
  phone: string;
  whatsappPhone?: string;
  website?: string;
}

export interface CreatedBusiness {
  id: string;
  slug: string;
  name: string;
}

export function createBusinessRequest(accessToken: string, input: CreateBusinessInput) {
  return request<CreatedBusiness>("/api/v1/businesses", {
    method: "POST",
    accessToken,
    body: JSON.stringify(input),
  });
}

export interface SubmittedClaim {
  id: string;
  status: ApprovalStatus;
  verificationMethod: string;
  docType: string;
  proofValue: string | null;
  proofUrl: string | null;
  proofFileName: string | null;
  createdAt: string;
}

export function submitClaimDocumentRequest(
  accessToken: string,
  businessId: string,
  input: { contactPhone: string; contactEmail: string; docType: string; docNumber?: string },
  file: File
) {
  const formData = new FormData();
  formData.append("contactPhone", input.contactPhone);
  formData.append("contactEmail", input.contactEmail);
  formData.append("docType", input.docType);
  if (input.docNumber) formData.append("docNumber", input.docNumber);
  formData.append("document", file);
  return requestForm<SubmittedClaim>(`/api/v1/businesses/${businessId}/claim/document`, "POST", formData, accessToken);
}

export function getClaimStatusRequest(accessToken: string, businessId: string) {
  return request<ClaimStatus>(`/api/v1/businesses/${businessId}/claim/status`, { accessToken });
}

// ── Admin review ─────────────────────────────────────────────────────────────

interface AdminBusinessRef {
  id: string;
  name: string;
  slug: string;
  city: { name: string } | null;
}

export interface AdminClaimRow {
  id: string;
  businessId: string;
  userId: string;
  status: ApprovalStatus;
  verificationMethod: string;
  proofValue: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null };
  business: AdminBusinessRef | null;
}

export function getAdminClaimsRequest(accessToken: string) {
  return request<AdminClaimRow[]>("/api/v1/admin/claims", { accessToken });
}

export function approveClaimRequest(accessToken: string, claimId: string) {
  return request<Record<string, unknown>>(`/api/v1/admin/claims/${claimId}/approve`, {
    method: "POST",
    accessToken,
  });
}

export function rejectClaimRequest(accessToken: string, claimId: string, adminNotes?: string) {
  return request<Record<string, unknown>>(`/api/v1/admin/claims/${claimId}/reject`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ adminNotes }),
  });
}

// ── Edit Suggestions & Listing Reports ───────────────────────────────────────

export function submitBusinessSuggestionRequest(
  accessToken: string,
  businessId: string,
  data: { type: string; details: string }
) {
  return request<{ message: string }>(`/api/v1/businesses/${businessId}/suggest-edit`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(data),
  });
}

export function submitBusinessReportRequest(
  accessToken: string,
  businessId: string,
  data: { reason: string; details: string }
) {
  return request<{ message: string }>(`/api/v1/businesses/${businessId}/report`, {
    method: "POST",
    accessToken,
    body: JSON.stringify(data),
  });
}

