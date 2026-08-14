/** One row as read straight from a staging CSV — see scripts/gmaps-scraper/types.ts STAGING_COLUMNS. */
export interface RawRow {
  staged_at: string;
  source_subcategory: string;
  source_city: string;
  source_location: string;
  source_mode: string;
  source_search_query: string;
  is_incomplete: string;
  is_permanently_closed: string;
  dedup_key: string;
  title: string;
  category: string;
  address: string;
  complete_address: string;
  plus_code: string;
  latitude: string;
  longitude: string;
  phone: string;
  website: string;
  open_hours: string;
  review_rating: string;
  review_count: string;
  place_id: string;
  cid: string;
  data_id: string;
  status: string;
  thumbnail: string;
  images: string;
  price_range: string;
  emails: string;
  link: string;
  [key: string]: string;
}

/** A row after clean+validate+normalize, ready for category resolution and dedup. */
export interface NormalizedBusiness {
  name: string;

  address: string;
  pincode: string | null;
  citySlug: string;

  lat: number | null;
  lng: number | null;

  phone: string | null;
  website: string | null;

  avgRating: number;
  reviewCount: number;

  openHoursRaw: string | null;
  externalPlaceId: string | null;

  sourceSubcategory: string;
  sourceCategoryText: string;

  sourceFile: string;
  sourceRowNumber: number;

  // Populated by the CSV enrichment pipeline (scripts/enrich-csv/) — object KEYS only, never
  // full URLs, so this stage never assumes a specific storage provider. Null/empty when the
  // input CSV wasn't enriched (e.g. running the importer directly against raw staging files).
  description: string | null;
  coverImageKey: string | null;
  galleryImageKeys: string[];
  badgeImageKey: string | null;
}

export interface RejectedRow {
  sourceFile: string;
  sourceRowNumber: number;
  reason: string;
}

export interface ImportSummary {
  csvsProcessed: number;
  rowsRead: number;
  businessesInserted: number;
  businessesSkippedExisting: number;
  duplicatesMerged: number;
  rejectedMissingAddress: number;
  categoryUnresolved: number;
  errors: number;
  executionMs: number;
  cleanedFilesWritten: number;
  cleanedRowsWritten: number;
}
