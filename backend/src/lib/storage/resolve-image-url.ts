import { getImageStorageAdapter } from "./r2-storage.adapter";
import type { ImageBucket } from "./image-storage.interface";

const storage = getImageStorageAdapter();

/**
 * Every stored image field (Business.coverImageUrl, BusinessMedia.url) holds a bare object key,
 * never a full URL — see business-writer.ts. This is the single place that turns a key into a
 * public URL, so every API response (search, detail, compare) resolves consistently and a future
 * storage/CDN swap only touches the adapter, not each consumer.
 */
export function resolveImageUrl(key: string | null | undefined, bucket: ImageBucket = "business"): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  return storage.resolveUrl(bucket, key);
}

/** BusinessMedia.type "badge" lives in the badge bucket; everything else ("image") is business. */
export function resolveMediaUrl(media: { url: string; type: string }): string | null {
  return resolveImageUrl(media.url, media.type === "badge" ? "badge" : "business");
}
