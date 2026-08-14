import { request as baseRequest, API_URL } from "@/app/lib/api";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; details?: unknown };
}

// The dashboard's business switcher (for owners with more than one business) needs every "/me/*"
// call below to be scoped to whichever business is currently selected. Threading a businessId
// param through every one of these ~40 call sites (and every call site that calls them) isn't
// worth it — instead the selected id lives here as module state, persisted so it survives a
// refresh, and gets attached as a header by the two request helpers every function below uses.
const ACTIVE_BUSINESS_STORAGE_KEY = "hubigo_active_business_id";
let activeBusinessId: string | null | undefined; // undefined = not yet read from localStorage

export function getActiveBusinessId(): string | null {
  if (activeBusinessId === undefined) {
    activeBusinessId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY) : null;
  }
  return activeBusinessId;
}

export function setActiveBusinessId(id: string | null) {
  activeBusinessId = id;
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, id);
  else localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
}

function businessHeaders(): Record<string, string> {
  const id = getActiveBusinessId();
  return id ? { "X-Business-Id": id } : {};
}

function request<T>(path: string, options: RequestInit & { accessToken?: string } = {}): Promise<T> {
  return baseRequest<T>(path, { ...options, headers: { ...businessHeaders(), ...(options.headers as Record<string, string> | undefined) } });
}

async function requestForm<T>(path: string, method: string, formData: FormData, accessToken: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    body: formData,
    headers: { Authorization: `Bearer ${accessToken}`, ...businessHeaders() },
    credentials: "include",
  });
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !body || !body.success) {
    throw new Error(body?.message ?? "Something went wrong. Please try again.");
  }
  return body.data;
}

const BASE = "/api/v1/businesses/me";

// ── Owned businesses (switcher) ─────────────────────────────────────────────

export interface OwnedBusinessSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isVerified: boolean;
  status: string;
  planTier: string;
}

export const getMyOwnedBusinesses = (accessToken: string) =>
  baseRequest<OwnedBusinessSummary[]>("/api/v1/users/me/businesses", { accessToken });

// ── Profile ──────────────────────────────────────────────────────────────

export interface DashboardAmenity {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface DashboardCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isPrimary: boolean;
}

export interface DashboardCategoryGroup {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: { id: string; name: string; slug: string; icon: string | null }[];
}

export interface DashboardService {
  id: string;
  name: string;
  description: string | null;
}

export interface DashboardHours {
  day: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface DashboardMedia {
  id: string;
  url: string | null;
  type: string;
  caption: string | null;
  sortOrder: number;
}

export interface DashboardProfile {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  website: string | null;
  address: string;
  pincode: string | null;
  priceRange: string | null;
  viewCount: number;
  avgRating: number;
  reviewCount: number;
  coverImageUrl: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  isClaimed: boolean;
  planTier: string;
  amenities: DashboardAmenity[];
  allAmenities: DashboardAmenity[];
  categories: DashboardCategory[];
  allCategories: DashboardCategoryGroup[];
  services: DashboardService[];
  hours: DashboardHours[];
  media: DashboardMedia[];
}

export const getDashboardProfile = (accessToken: string) => request<DashboardProfile>(`${BASE}/profile`, { accessToken });

export const updateDashboardProfile = (
  accessToken: string,
  input: Partial<{ description: string; phone: string; whatsappPhone: string; website: string; address: string; pincode: string; priceRange: string }>,
) => request<unknown>(`${BASE}/profile`, { method: "PATCH", accessToken, body: JSON.stringify(input) });

export const updateDashboardHours = (accessToken: string, hours: DashboardHours[]) =>
  request<DashboardHours[]>(`${BASE}/profile/hours`, { method: "PUT", accessToken, body: JSON.stringify({ hours }) });

export const updateDashboardAmenities = (accessToken: string, amenityIds: string[]) =>
  request<unknown>(`${BASE}/profile/amenities`, { method: "PUT", accessToken, body: JSON.stringify({ amenityIds }) });

export const addCustomDashboardAmenity = (accessToken: string, name: string) =>
  request<DashboardAmenity>(`${BASE}/profile/amenities/custom`, { method: "POST", accessToken, body: JSON.stringify({ name }) });

export const updateDashboardCategories = (accessToken: string, categoryIds: string[]) =>
  request<DashboardCategory[]>(`${BASE}/profile/categories`, { method: "PUT", accessToken, body: JSON.stringify({ categoryIds }) });

export const addDashboardService = (accessToken: string, input: { name: string; description?: string }) =>
  request<DashboardService>(`${BASE}/profile/services`, { method: "POST", accessToken, body: JSON.stringify(input) });

export const updateDashboardService = (accessToken: string, serviceId: string, input: { name: string; description?: string }) =>
  request<DashboardService>(`${BASE}/profile/services/${serviceId}`, { method: "PATCH", accessToken, body: JSON.stringify(input) });

export const deleteDashboardService = (accessToken: string, serviceId: string) =>
  request<null>(`${BASE}/profile/services/${serviceId}`, { method: "DELETE", accessToken });

export const uploadDashboardLogo = (accessToken: string, file: File) => {
  const fd = new FormData();
  fd.append("image", file);
  return requestForm<{ logoUrl: string }>(`${BASE}/profile/logo`, "PUT", fd, accessToken);
};

export const uploadDashboardCover = (accessToken: string, file: File) => {
  const fd = new FormData();
  fd.append("image", file);
  return requestForm<{ coverImageUrl: string }>(`${BASE}/profile/cover`, "PUT", fd, accessToken);
};

export const uploadDashboardGallery = (accessToken: string, files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));
  return requestForm<DashboardMedia[]>(`${BASE}/profile/media`, "POST", fd, accessToken);
};

export const deleteDashboardMedia = (accessToken: string, mediaId: string) =>
  request<null>(`${BASE}/profile/media/${mediaId}`, { method: "DELETE", accessToken });

// ── Offers ───────────────────────────────────────────────────────────────

export interface DashboardOffer {
  id: string;
  title: string;
  description: string | null;
  discountLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export const getDashboardOffers = (accessToken: string) => request<DashboardOffer[]>(`${BASE}/offers`, { accessToken });

export const createDashboardOffer = (accessToken: string, input: Partial<DashboardOffer>) =>
  request<DashboardOffer>(`${BASE}/offers`, { method: "POST", accessToken, body: JSON.stringify(input) });

export const updateDashboardOffer = (accessToken: string, offerId: string, input: Partial<DashboardOffer>) =>
  request<DashboardOffer>(`${BASE}/offers/${offerId}`, { method: "PATCH", accessToken, body: JSON.stringify(input) });

export const deleteDashboardOffer = (accessToken: string, offerId: string) =>
  request<null>(`${BASE}/offers/${offerId}`, { method: "DELETE", accessToken });

// ── Leads ────────────────────────────────────────────────────────────────

export interface DashboardLead {
  id: string;
  type: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "CLOSED";
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null } | null;
  // Set only for "competitor" leads — this business was one of the 2 nearest paid businesses in
  // the same category as sourceBusiness, which the lead's user actually viewed/contacted.
  sourceBusiness: { id: string; name: string; slug: string } | null;
}

export const getDashboardLeads = (accessToken: string) => request<DashboardLead[]>(`${BASE}/leads`, { accessToken });

export const updateDashboardLeadStatus = (accessToken: string, leadId: string, status: DashboardLead["status"]) =>
  request<DashboardLead>(`${BASE}/leads/${leadId}/status`, { method: "PATCH", accessToken, body: JSON.stringify({ status }) });

// ── Reviews ──────────────────────────────────────────────────────────────

export interface DashboardReview {
  id: string;
  authorName: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

export const getDashboardReviews = (accessToken: string) => request<DashboardReview[]>(`${BASE}/reviews`, { accessToken });

export const replyToDashboardReview = (accessToken: string, reviewId: string, reply: string) =>
  request<DashboardReview>(`${BASE}/reviews/${reviewId}/reply`, { method: "POST", accessToken, body: JSON.stringify({ reply }) });

// ── Appointments ─────────────────────────────────────────────────────────

export interface DashboardAppointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string | null;
  scheduledAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes: string | null;
  createdAt: string;
}

export const getDashboardAppointments = (accessToken: string) => request<DashboardAppointment[]>(`${BASE}/appointments`, { accessToken });

export const createDashboardAppointment = (
  accessToken: string,
  input: { customerName: string; customerPhone: string; serviceName?: string; scheduledAt: string; notes?: string },
) => request<DashboardAppointment>(`${BASE}/appointments`, { method: "POST", accessToken, body: JSON.stringify(input) });

export const updateDashboardAppointment = (accessToken: string, appointmentId: string, input: Partial<DashboardAppointment>) =>
  request<DashboardAppointment>(`${BASE}/appointments/${appointmentId}`, { method: "PATCH", accessToken, body: JSON.stringify(input) });

export const deleteDashboardAppointment = (accessToken: string, appointmentId: string) =>
  request<null>(`${BASE}/appointments/${appointmentId}`, { method: "DELETE", accessToken });

// ── Products ─────────────────────────────────────────────────────────────

export interface DashboardProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export const getDashboardProducts = (accessToken: string) => request<DashboardProduct[]>(`${BASE}/products`, { accessToken });

export const createDashboardProduct = (
  accessToken: string,
  input: { name: string; description?: string; price?: number; category?: string; isAvailable?: boolean },
  file?: File,
) => {
  const fd = new FormData();
  Object.entries(input).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
  if (file) fd.append("image", file);
  return requestForm<DashboardProduct>(`${BASE}/products`, "POST", fd, accessToken);
};

export const updateDashboardProduct = (
  accessToken: string,
  productId: string,
  input: Partial<{ name: string; description: string; price: number; category: string; isAvailable: boolean }>,
  file?: File,
) => {
  const fd = new FormData();
  Object.entries(input).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
  if (file) fd.append("image", file);
  return requestForm<DashboardProduct>(`${BASE}/products/${productId}`, "PATCH", fd, accessToken);
};

export const deleteDashboardProduct = (accessToken: string, productId: string) =>
  request<null>(`${BASE}/products/${productId}`, { method: "DELETE", accessToken });

// ── Messages ─────────────────────────────────────────────────────────────

export interface DashboardMessage {
  id: string;
  conversationId: string;
  sender: "BUSINESS" | "CUSTOMER";
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardConversation {
  id: string;
  customerName: string;
  customerPhone: string | null;
  lastMessageAt: string;
  createdAt: string;
  messages: DashboardMessage[];
}

export const getDashboardConversations = (accessToken: string) => request<DashboardConversation[]>(`${BASE}/conversations`, { accessToken });

export const getDashboardConversationMessages = (accessToken: string, conversationId: string) =>
  request<{ conversation: DashboardConversation; messages: DashboardMessage[] }>(`${BASE}/conversations/${conversationId}`, { accessToken });

export const replyToDashboardConversation = (accessToken: string, conversationId: string, body: string) =>
  request<DashboardMessage>(`${BASE}/conversations/${conversationId}/messages`, { method: "POST", accessToken, body: JSON.stringify({ body }) });

export const deleteDashboardConversation = (accessToken: string, conversationId: string) =>
  request<null>(`${BASE}/conversations/${conversationId}`, { method: "DELETE", accessToken });

export const startConversationWithBusiness = (accessToken: string, businessId: string, body: string) =>
  request<{ conversation: DashboardConversation; message: DashboardMessage }>(`/api/v1/businesses/${businessId}/messages`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ body }),
  });

// ── Notifications ────────────────────────────────────────────────────────

export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export const getDashboardNotifications = (accessToken: string) =>
  request<DashboardNotification[]>("/api/v1/users/me/notifications", { accessToken });

export const markDashboardNotificationRead = (accessToken: string, id: string) =>
  request<null>(`/api/v1/users/me/notifications/${id}/read`, { method: "PATCH", accessToken });

export const markAllDashboardNotificationsRead = (accessToken: string) =>
  request<null>("/api/v1/users/me/notifications/read-all", { method: "PATCH", accessToken });

export const clearAllDashboardNotifications = (accessToken: string) =>
  request<null>("/api/v1/users/me/notifications", { method: "DELETE", accessToken });
