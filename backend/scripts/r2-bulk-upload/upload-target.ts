import fs from "node:fs";
import path from "node:path";
import { getImageStorageAdapter } from "../../src/lib/storage/r2-storage.adapter";
import type { ImageBucket } from "../../src/lib/storage/image-storage.interface";
import { walkImages, type LocalImageFile } from "./walk-images";
import { asyncPool } from "./async-pool";
import { withRetry } from "./retry";
import { ProgressReporter } from "./progress";

// This bulk importer only ever sources from local Pixabay-style directories for business/badge
// images — claim documents (the third ImageBucket variant) are live user uploads, never bulk
// imported, so they're deliberately excluded here.
export const SOURCE_ROOTS: Record<Extract<ImageBucket, "business" | "badge">, string> = {
  business: path.join(__dirname, "../pixabay-image-sourcing/output/Final Images"),
  badge: path.join(__dirname, "../pixabay-badge-images/output/badges"),
};

export interface FailedEntry {
  bucket: ImageBucket;
  key: string;
  absPath: string;
  error: string;
}

export interface UploadTargetResult {
  target: ImageBucket;
  total: number;
  uploaded: number;
  skipped: number;
  failed: number;
  bytesUploaded: number;
  durationMs: number;
  failedLogPath: string | null;
}

export async function uploadTarget(
  target: Extract<ImageBucket, "business" | "badge">,
  opts: { concurrency: number; limit?: number | null; retryFailedPath?: string | null; label?: string },
): Promise<UploadTargetResult> {
  const startedAt = Date.now();

  let files: LocalImageFile[];
  if (opts.retryFailedPath) {
    const failedEntries: FailedEntry[] = JSON.parse(fs.readFileSync(opts.retryFailedPath, "utf8"));
    files = failedEntries
      .filter((e) => e.bucket === target)
      .map((e) => ({ absPath: e.absPath, relKey: e.key, sizeBytes: fs.statSync(e.absPath).size }));
    console.log(`Retrying ${files.length} previously-failed ${target} uploads from ${opts.retryFailedPath}`);
  } else {
    const root = SOURCE_ROOTS[target];
    if (!fs.existsSync(root)) throw new Error(`Source directory not found: ${root}`);
    files = walkImages(root);
    console.log(`[${target}] Found ${files.length} image files under ${root}`);
  }

  if (opts.limit) files = files.slice(0, opts.limit);

  if (files.length === 0) {
    console.log(`[${target}] Nothing to upload.`);
    return {
      target,
      total: 0,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      bytesUploaded: 0,
      durationMs: Date.now() - startedAt,
      failedLogPath: null,
    };
  }

  const adapter = getImageStorageAdapter();
  const progress = new ProgressReporter(files.length, opts.label ?? `[${target}] `);
  const failed: FailedEntry[] = [];

  await asyncPool(files, opts.concurrency, async (file) => {
    try {
      const outcome = await withRetry(() => adapter.uploadIfMissing(target, file.relKey, file.absPath), {
        attempts: 4,
        baseDelayMs: 500,
      });
      if (outcome.skipped) progress.recordSkipped();
      else progress.recordUploaded(file.sizeBytes);
    } catch (err) {
      progress.recordFailed();
      failed.push({
        bucket: target,
        key: file.relKey,
        absPath: file.absPath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  progress.finish();
  const summary = progress.summary;

  let failedLogPath: string | null = null;
  if (failed.length > 0) {
    const logDir = path.join(__dirname, "logs");
    fs.mkdirSync(logDir, { recursive: true });
    failedLogPath = path.join(logDir, `failed-${target}-${Date.now()}.json`);
    fs.writeFileSync(failedLogPath, JSON.stringify(failed, null, 2));
    console.log(`[${target}] ${failed.length} uploads failed after retries — logged to ${failedLogPath}`);
  }

  return {
    target,
    total: files.length,
    uploaded: summary.uploaded,
    skipped: summary.skipped,
    failed: summary.failed,
    bytesUploaded: summary.bytesUploaded,
    durationMs: Date.now() - startedAt,
    failedLogPath,
  };
}
