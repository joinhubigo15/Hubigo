export interface CategoryRecord {
  priority: number;
  sectorRank: number;
  sector: string;
  densityTier: string;
  subcategory: string;
}

export type City = "bangalore" | "chennai" | "mumbai" | "hyderabad";

export const CITIES: City[] = ["bangalore", "chennai", "mumbai", "hyderabad"];

export const CITY_LABEL: Record<City, string> = {
  bangalore: "Bangalore",
  chennai: "Chennai",
  mumbai: "Mumbai",
  hyderabad: "Hyderabad",
};

export type SearchMode = "plain" | "area";

export const MODE_CREDIT_COST: Record<SearchMode, number> = {
  plain: 2,
  area: 10,
};

export interface QueryTask {
  subcategory: string;
  city: City;
  location: string;
  mode: SearchMode;
}

/** Composite key used for the idempotency ledger. */
export function taskKey(task: QueryTask): string {
  return [task.subcategory, task.city, task.location, task.mode].join("|");
}

/** One row as returned by GET /jobs/:id/download, field names confirmed against a live probe call. */
export interface RawLeadRow {
  input_id: string;
  link: string;
  title: string;
  category: string;
  address: string;
  open_hours: string;
  popular_times: string;
  website: string;
  phone: string;
  plus_code: string;
  review_count: string;
  review_rating: string;
  reviews_per_rating: string;
  latitude: string;
  longitude: string;
  cid: string;
  status: string;
  descriptions: string;
  reviews_link: string;
  thumbnail: string;
  timezone: string;
  price_range: string;
  data_id: string;
  street_view_url: string;
  place_id: string;
  images: string;
  reservations: string;
  order_online: string;
  menu: string;
  owner: string;
  complete_address: string;
  credit_cards_accepted: string;
  about: string;
  user_reviews: string;
  user_reviews_extended: string;
  emails: string;
  [key: string]: string;
}

/** Columns written to the staging CSV: our tracking metadata first, then the raw API fields verbatim. */
export const STAGING_METADATA_COLUMNS = [
  "staged_at",
  "source_subcategory",
  "source_city",
  "source_location",
  "source_mode",
  "source_search_query",
  "is_incomplete",
  "is_permanently_closed",
  "dedup_key",
] as const;

export const STAGING_RAW_COLUMNS = [
  "title",
  "category",
  "address",
  "complete_address",
  "plus_code",
  "latitude",
  "longitude",
  "phone",
  "website",
  "open_hours",
  "review_rating",
  "review_count",
  "place_id",
  "cid",
  "data_id",
  "status",
  "thumbnail",
  "images",
  "price_range",
  "emails",
  "link",
] as const;

export const STAGING_COLUMNS = [...STAGING_METADATA_COLUMNS, ...STAGING_RAW_COLUMNS];

export interface RunSummaryRow {
  timestamp: string;
  subcategory: string;
  city: City;
  location: string;
  mode: SearchMode;
  creditsSpent: number;
  leadCount: number;
  status: "complete" | "failed" | "skipped_idempotent";
  note: string;
}
