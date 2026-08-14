export type ImageBucket = "business" | "badge" | "docs" | "avatars";

export interface UploadOutcome {
  key: string;
  skipped: boolean;
}

/**
 * Storage-agnostic contract for uploaded business/badge images. The importer and enrichment
 * pipeline depend only on this interface — swapping the backing provider (R2 today, anything
 * S3-compatible later) never requires touching pipeline code, only the adapter implementation.
 */
export interface ImageStorageAdapter {
  readonly name: string;
  /** Uploads localFilePath to `key` in the given bucket unless it already exists there. */
  uploadIfMissing(bucket: ImageBucket, key: string, localFilePath: string): Promise<UploadOutcome>;
  /** Uploads an in-memory buffer (e.g. a multer file) to `key`, always overwriting — used for
   * live user uploads (business logo/cover/gallery/product images), unlike the bulk
   * importer's uploadIfMissing which is resumable-skip against a local file path. */
  uploadBuffer(bucket: ImageBucket, key: string, buffer: Buffer, contentType: string): Promise<{ key: string }>;
  /** Deletes an object — used when a user replaces or removes an uploaded image. */
  delete(bucket: ImageBucket, key: string): Promise<void>;
  /** True if an object already exists at this key (used for resumable/skip-existing uploads). */
  exists(bucket: ImageBucket, key: string): Promise<boolean>;
  /** Public URL for a key, or null if no public base URL is configured yet. */
  resolveUrl(bucket: ImageBucket, key: string): string | null;
}
