/**
 * Runs the full production upload for both buckets sequentially (business, then badge) and
 * prints a combined final report. See run.ts for single-target usage/flags.
 *
 * Usage (run from backend/):
 *   npx tsx scripts/r2-bulk-upload/run-all.ts
 *   npx tsx scripts/r2-bulk-upload/run-all.ts --concurrency=20
 */
import { r2Enabled } from "../../src/config/env";
import { uploadTarget, type UploadTargetResult } from "./upload-target";
import { formatDuration } from "./progress";

function parseConcurrency(): number {
  const raw = process.argv.slice(2);
  const arg = raw.find((a) => a.startsWith("--concurrency="));
  return arg ? Number(arg.split("=")[1]) : 15;
}

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

async function main() {
  if (!r2Enabled) {
    throw new Error(
      "Cloudflare R2 is not configured (R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_ENDPOINT) — aborting.",
    );
  }

  const concurrency = parseConcurrency();
  const overallStart = Date.now();

  const results: UploadTargetResult[] = [];
  results.push(await uploadTarget("business", { concurrency, label: "[business] " }));
  results.push(await uploadTarget("badge", { concurrency, label: "[badge] " }));

  const totalDurationMs = Date.now() - overallStart;
  const totals = results.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      uploaded: acc.uploaded + r.uploaded,
      skipped: acc.skipped + r.skipped,
      failed: acc.failed + r.failed,
      bytesUploaded: acc.bytesUploaded + r.bytesUploaded,
    }),
    { total: 0, uploaded: 0, skipped: 0, failed: 0, bytesUploaded: 0 },
  );
  const failedLogs = results.map((r) => r.failedLogPath).filter((p): p is string => Boolean(p));

  console.log("\n================ R2 UPLOAD COMPLETE ================");
  console.log(`Total files uploaded : ${totals.uploaded}`);
  console.log(`Total skipped        : ${totals.skipped}`);
  console.log(`Total failed         : ${totals.failed}`);
  console.log(`Total time taken     : ${formatDuration(totalDurationMs / 1000)}`);
  console.log(`Total storage uploaded: ${formatBytes(totals.bytesUploaded)}`);
  console.log(`Retry log(s)         : ${failedLogs.length > 0 ? failedLogs.join(", ") : "none"}`);
  console.log("======================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
