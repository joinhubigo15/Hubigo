export type SortOption =
  | "best_match"
  | "distance"
  | "rating"
  | "reviews"
  | "newest"
  | "alphabetical";

export interface SearchParams {
  q?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  citySlug?: string;
  localitySlug?: string;
  areaSlug?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  openNow?: boolean;
  verifiedOnly?: boolean;
  minRating?: number;
  priceRanges?: string[];
  amenitySlugs?: string[];
  hasOffers?: boolean;
  planTiers?: string[];
  sort: SortOption;
  page: number;
  limit: number;
}

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  planTier: string;
  isVerified: boolean;
  isTrusted: boolean;
  avgRating: number;
  reviewCount: number;
  priceRange: string | null;
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

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Only meaningful on business search results — whether any platform-verified business matches
   * the current category/city/rating filters, independent of whether "Verified Only" itself is
   * toggled on. Drives whether the frontend enables that filter checkbox at all. */
  hasVerifiedMatches?: boolean;
}
