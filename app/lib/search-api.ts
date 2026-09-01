import { request } from "@/app/lib/api";

export type SortOption = "best_match" | "distance" | "rating" | "reviews" | "newest" | "alphabetical";
export type PriceRange = "budget" | "moderate" | "premium" | "luxury";
export type PlanTier = "basic" | "premium" | "elite";

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  planTier: PlanTier;
  isVerified: boolean;
  isTrusted: boolean;
  avgRating: number;
  reviewCount: number;
  priceRange: PriceRange | null;
  address: string;
  citySlug: string;
  cityName: string;
  localitySlug: string | null;
  localityName: string | null;
  areaSlug: string | null;
  areaName: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  primaryCategoryName: string | null;
  primaryCategorySlug: string | null;
  isOpenNow: boolean | null;
  hasActiveOffer: boolean;
  score: number;
}

export function formatDisplayArea(address?: string | null, areaName?: string | null, localityName?: string | null): string {
  if (address) {
    if (/j\.?\s*p\.?\s*nagar/i.test(address)) return "JP Nagar";
    if (/indiranagar/i.test(address)) return "Indiranagar";
    if (/whitefield/i.test(address)) return "Whitefield";
    if (/hsr\s*layout/i.test(address)) return "HSR Layout";
    if (/koramangala/i.test(address)) return "Koramangala";
    if (/rajajinagar/i.test(address)) return "Rajajinagar";
    if (/jayanagar/i.test(address)) return "Jayanagar";
    if (/hebbal/i.test(address)) return "Hebbal";
    if (/electronic\s*city/i.test(address)) return "Electronic City";
    if (/banashankari/i.test(address)) return "Banashankari";
    if (/btm\s*layout/i.test(address)) return "BTM Layout";
    if (/marathahalli/i.test(address)) return "Marathahalli";
    if (/yelahanka/i.test(address)) return "Yelahanka";
    if (/malleshwaram/i.test(address)) return "Malleshwaram";
    if (/sarjapur/i.test(address)) return "Sarjapur";
    if (/bellandur/i.test(address)) return "Bellandur";
  }
  return areaName || localityName || "Bangalore";
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Only meaningful on business search results — whether any platform-verified business matches
   * the current category/city/rating filters, regardless of whether "Verified Only" is toggled. */
  hasVerifiedMatches?: boolean;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  subcategory?: string;
  city?: string;
  locality?: string;
  area?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  openNow?: boolean;
  verified?: boolean;
  minRating?: number;
  price?: PriceRange[];
  amenities?: string[];
  offers?: boolean;
  tier?: PlanTier[];
  sort?: SortOption;
  page?: number;
  limit?: number;
}

function buildQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export function searchBusinesses(filters: SearchFilters) {
  const qs = buildQueryString(filters);
  return request<PaginatedResult<BusinessSummary>>(`/api/v1/search${qs ? `?${qs}` : ""}`);
}

export interface Suggestion {
  type: "business" | "category" | "locality" | "city";
  label: string;
  sublabel: string | null;
  slug: string;
  citySlug: string | null;
}

export function getSuggestions(q: string, limit = 8) {
  if (!q.trim()) return Promise.resolve<Suggestion[]>([]);
  return request<Suggestion[]>(`/api/v1/search/suggestions?q=${encodeURIComponent(q)}&limit=${limit}`);
}

export function getPopularSearches(limit = 8) {
  return request<string[]>(`/api/v1/search/popular?limit=${limit}`);
}

/** For a "top {category} in {location}" query, returns the matching pSEO page path (e.g.
 * "/category/hotels/bangalore/whitefield"), or null if the phrasing doesn't match or resolves to
 * no qualifying page — callers should fall back to a normal search in either case. */
export function resolveTopSearch(q: string): Promise<string | null> {
  return request<{ path: string | null }>(`/api/v1/pseo/resolve-search?q=${encodeURIComponent(q)}`).then((r) => r.path);
}

// Cheap client-side pre-check so the resolve-search API call only ever fires for text that could
// plausibly be a "top {category} in {location}" or "best {category} in {location}" query — every
// other search (the vast majority) skips the extra round-trip entirely. Shared by every search
// entry point (the /search page's bar and the homepage hero bar) so they stay in sync.
export const TOP_X_IN_Y_PATTERN = /^(?:top|best)\s+.+\s+in\s+.+$/i;

/** Resolves a query to its pSEO page path if it matches "top/best {category} in {location}" and
 * a qualifying page exists; otherwise resolves to `null` so the caller can fall back to a normal
 * search. Strips the leading "top"/"best" from the query text it hands back for that fallback —
 * left in, it pollutes the trigram/ILIKE text match (e.g. "top saree store" can miss real "saree"
 * businesses that "saree store" would find). */
export async function resolveTopSearchOrFallback(rawQuery: string): Promise<{ path: string; fallback: null } | { path: null; fallback: string }> {
  const trimmed = rawQuery.trim();
  const fallback = trimmed.replace(/^(?:top|best)\s+/i, "");
  if (!TOP_X_IN_Y_PATTERN.test(trimmed)) return { path: null, fallback };
  try {
    const path = await resolveTopSearch(trimmed);
    return path ? { path, fallback: null } : { path: null, fallback };
  } catch {
    return { path: null, fallback };
  }
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  businessCount: number;
  subcategories: { id: string; name: string; slug: string; icon: string | null; businessCount: number }[];
}

export function getCategories() {
  return request<CategoryOption[]>("/api/v1/categories");
}

export interface CityOption {
  id: string;
  name: string;
  slug: string;
  state: string;
  lat: number | null;
  lng: number | null;
  businessCount: number;
  /** Distinct pincodes actually present in our scraped business data for this city — a real,
   * verifiable coverage number rather than a rounded marketing figure. */
  pincodeCount: number;
}

export function getCities() {
  return request<CityOption[]>("/api/v1/cities");
}

export interface LocalityOption {
  id: string;
  name: string;
  slug: string;
  pincode: string | null;
  businessCount: number;
}

export function getLocalities(citySlug: string) {
  return request<LocalityOption[]>(`/api/v1/cities/${citySlug}/localities`);
}

export interface AreaOption {
  name: string;
  slug: string;
  citySlug: string;
  cityName: string;
}

export function getArea(citySlug: string, areaSlug: string) {
  return request<AreaOption>(`/api/v1/cities/${citySlug}/areas/${areaSlug}`);
}

export interface PseoSitemapCandidate {
  path: string;
  count: number;
  /** Real data-derived signal (MAX of the group's businesses' updatedAt), ISO string or null. */
  lastmod: string | null;
}

/** Raw candidate pSEO combos across all 4 templates (backend pre-filters to a safe superset —
 * see CANDIDATE_FLOOR in pseo.service.ts) — the sitemap builder still has to apply the real
 * MIN_INDEXABLE gate itself via evaluatePseoGate() before using these. */
export function getPseoSitemapCandidates() {
  return request<PseoSitemapCandidate[]>("/api/v1/pseo/sitemap-entries");
}

export interface AmenityOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export function getAmenities() {
  return request<AmenityOption[]>("/api/v1/amenities");
}

export interface CompareBusiness {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  planTier: PlanTier;
  isVerified: boolean;
  isTrusted: boolean;
  avgRating: number;
  reviewCount: number;
  priceRange: PriceRange | null;
  address: string;
  city: string;
  locality: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  website: string | null;
  openHoursRaw: string | null;
  distanceKm: number | null;
  primaryCategory: string | null;
  amenities: string[];
  hours: { day: string; openTime: string | null; closeTime: string | null; isClosed: boolean }[];
  photos: string[];
  hasActiveOffer: boolean;
  hubigoScore: number;
}

export function compareBusinesses(slugs: string[], lat?: number, lng?: number) {
  const params = new URLSearchParams({ slugs: slugs.join(",") });
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));
  return request<CompareBusiness[]>(`/api/v1/businesses/compare?${params.toString()}`);
}

export interface ResolvedAddress {
  lat: number;
  lng: number;
  addressName: string;
  citySlug: string;
}

/** Resolves free text or a pincode to real coordinates using our own City/Locality data only —
 * throws ApiClientError (404) if the location isn't in a currently-supported city. */
export function geocodeLocalAddress(q: string) {
  return request<ResolvedAddress>(`/api/v1/cities/geocode?q=${encodeURIComponent(q)}`);
}

export function compareNearby(input: { subcategory?: string; category?: string; lat: number; lng: number; limit?: number }) {
  const params = new URLSearchParams({ lat: String(input.lat), lng: String(input.lng) });
  if (input.subcategory) params.set("subcategory", input.subcategory);
  if (input.category) params.set("category", input.category);
  if (input.limit != null) params.set("limit", String(input.limit));
  return request<CompareBusiness[]>(`/api/v1/businesses/compare/nearby?${params.toString()}`);
}

export interface BusinessDetailCategory {
  isPrimary: boolean;
  category: { id: string; name: string; slug: string; icon: string | null };
}

export interface BusinessDetailAmenity {
  amenity: { id: string; name: string; slug: string; icon: string | null };
}

export interface BusinessDetailService {
  id: string;
  name: string;
  description: string | null;
}

export interface BusinessDetailHours {
  day: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface BusinessDetailMedia {
  id: string;
  url: string;
  type: string;
  sortOrder: number;
}

export interface BusinessDetailOffer {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface BusinessDetailProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  category: string | null;
}

export interface BusinessDetailReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface BusinessDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsappPhone: string | null;
  website: string | null;
  planTier: PlanTier;
  isVerified: boolean;
  isTrusted: boolean;
  isClaimed: boolean;
  priceRange: PriceRange | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  openHoursRaw: string | null;
  isOpenNow: boolean | null;
  closesAt: string | null;
  /** True when the scraper only had one day's hours for this business and every day of the
   * displayed weekly schedule is that single day's hours replicated — real per-day hours may
   * differ, so the UI should caveat it. */
  hoursInferredFromSingleDay: boolean;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  city: { id: string; name: string; slug: string };
  locality: { id: string; name: string; slug: string } | null;
  areaName: string | null;
  categories: BusinessDetailCategory[];
  amenities: BusinessDetailAmenity[];
  services: BusinessDetailService[];
  hours: BusinessDetailHours[];
  media: BusinessDetailMedia[];
  offers: BusinessDetailOffer[];
  products: BusinessDetailProduct[];
  reviews: BusinessDetailReview[];
  keywords?: string[];
  externalPlaceId?: string;
}

export function getBusinessBySlug(slug: string, accessToken?: string) {
  return request<BusinessDetail>(`/api/v1/businesses/${slug}`, accessToken ? { accessToken } : {});
}

/** Publishes immediately — there is no admin moderation queue for customer-submitted reviews. */
export function postBusinessReview(businessId: string, rating: number, comment: string, accessToken: string) {
  return request<BusinessDetailReview>(`/api/v1/businesses/${businessId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
    accessToken,
  });
}

/** Fire-and-forget: lets the backend attribute a Call/WhatsApp click to the logged-in visitor
 * for competitor-lead routing. Anonymous visitors can call this too — it just no-ops server-side. */
export function trackBusinessInteraction(slug: string, type: "CALL" | "WHATSAPP", accessToken?: string) {
  return request<null>(`/api/v1/businesses/${slug}/interactions`, {
    method: "POST",
    body: JSON.stringify({ type }),
    accessToken,
  });
}
