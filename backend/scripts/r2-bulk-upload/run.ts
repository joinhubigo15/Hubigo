/**
 * Production bulk uploader: pushes the local sourced-image folders up to Cloudflare R2,
 * preserving folder structure exactly (folder name -> key prefix, filename -> key suffix).
 * Business images and badge images go to two separate buckets and are never mixed.
 *
 * Resumable: HEADs each key first and skips it if already present, so a re-run after a
 * partial failure only uploads what's missing. Failed uploads (after retries) are written to
 * a JSON log for inspection / a later --retry-failed pass.
 *
 * Usage (run from backend/):
 *   npx tsx scripts/r2-bulk-upload/run.ts --target=business
 *   npx tsx scripts/r2-bulk-upload/run.ts --target=badge
 *   npx tsx scripts/r2-bulk-upload/run.ts --target=business --concurrency=20
 *   npx tsx scripts/r2-bulk-upload/run.ts --target=business --retry-failed=path/to/failed.json
 *   npx tsx scripts/r2-bulk-upload/run.ts --target=business --dry-run
 *
 * To upload both buckets in one run with a combined final report, use run-all.ts instead.
 */
import fs from "node:fs";
import path from "node:path";
import { r2Enabled } from "../../src/config/env";
import type { ImageBucket } from "../../src/lib/storage/image-storage.interface";
import { walkImages } from "./walk-images";
import { SOURCE_ROOTS, uploadTarget } from "./upload-target";

interface Args {
  target: Extract<ImageBucket, "business" | "badge">;
  concurrency: number;
  dryRun: boolean;
  retryFailedPath: string | null;
  limit: number | null;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const get = (name: string) => raw.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

  const target = get("target");
  if (target !== "business" && target !== "badge") {
    throw new Error('Missing/invalid --target=business|badge');
  }

  return {
    target,
    concurrency: Number(get("concurrency") ?? 15),
    dryRun: raw.includes("--dry-run"),
    retryFailedPath: get("retry-failed") ?? null,
    limit: get("limit") ? Number(get("limit")) : null,
  };
}

async function main() {
  const args = parseArgs();

  if (!r2Enabled && !args.dryRun) {
    throw new Error(
      "Cloudflare R2 is not configured (R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_ENDPOINT) — aborting.",
    );
  }

  if (args.dryRun) {
    const root = SOURCE_ROOTS[args.target];
    if (!fs.existsSync(root)) throw new Error(`Source directory not found: ${root}`);
    const files = walkImages(root).slice(0, args.limit ?? undefined);
    console.log(`[dry-run] would upload ${files.length} files to bucket "${args.target}". Sample keys:`);
    for (const f of files.slice(0, 10)) console.log(`  ${f.relKey}`);
    return;
  }

  const result = await uploadTarget(args.target, {
    concurrency: args.concurrency,
    limit: args.limit,
    retryFailedPath: args.retryFailedPath,
  });

  console.log("Summary:", result);
  if (result.failedLogPath) {
    console.log(
      `Retry with: npx tsx scripts/r2-bulk-upload/run.ts --target=${args.target} --retry-failed=${result.failedLogPath}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
