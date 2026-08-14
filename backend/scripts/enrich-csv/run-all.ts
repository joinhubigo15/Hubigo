/**
 * Batch-enriches every real staging CSV under scripts/gmaps-scraper/staging/ (one file per
 * subcategory) and writes the enriched copies to scripts/gmaps-scraper/staging-enriched/,
 * preserving filenames. Skips any file that doesn't look like a staging CSV (no
 * source_subcategory column) rather than guessing — a handful of stray non-staging CSVs live
 * alongside the real ones in that directory.
 *
 * Pure local/offline, same as run.ts — no DB, no R2 calls.
 *
 * Usage (run from backend/):
 *   npx tsx scripts/enrich-csv/run-all.ts
 */
import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "../../src/importer/parser/csv";
import { stringifyCsv } from "../../src/importer/enrichment/csv-stringify";
import { enrichRow, ENRICHMENT_COLUMNS } from "../../src/importer/enrichment/enrich-row";
import { loadEnrichmentPools } from "../../src/importer/enrichment/load-pools";

const STAGING_DIR = path.join(__dirname, "../gmaps-scraper/staging");
// Same top-level backend/cleaned-data/ the main importer CLI writes to (see
// src/importer/exporter/cleaned-csv-writer.ts), under its own subfolder — this step runs
// earlier in the pipeline (raw staging rows + description/image keys, pre-dedup) and uses a
// different column schema than that CLI's post-dedup output, so the files must not collide.
const OUTPUT_DIR = path.join(__dirname, "../../cleaned-data/enriched-staging");

interface FileReport {
  file: string;
  rows: number;
  warnings: number;
}

/** Reads just enough of the file to get the header line, without loading the whole thing. */
function readFirstLine(filePath: string): string | null {
  const fd = fs.openSync(filePath, "r");
  try {
    const bufSize = 65536;
    const buf = Buffer.alloc(bufSize);
    const bytesRead = fs.readSync(fd, buf, 0, bufSize, 0);
    const chunk = buf.toString("utf8", 0, bytesRead);
    const newlineIndex = chunk.indexOf("\n");
    if (newlineIndex === -1) return chunk.length > 0 ? chunk : null;
    return chunk.slice(0, newlineIndex).replace(/\r$/, "");
  } finally {
    fs.closeSync(fd);
  }
}

function main() {
  const pools = loadEnrichmentPools();
  console.log(
    `Loaded pools: ${pools.descriptions.size} description subcategories, ` +
      `${pools.businessImagesByFolder.size} business-image folders, ${pools.badgeImagesByFolder.size} badge-image folders`,
  );

  // Only real per-subcategory staging files match this naming convention. A few aggregate/
  // rollup files live in the same directory (businesses.csv, clean-leads.csv, no-contact-
  // leads.csv, run-summary.csv, ...) — they share the same columns (so a header check alone
  // can't tell them apart) but are concatenations of the per-subcategory files, actively
  // rewritten by the still-running scraper, and one of them is 700MB+. Processing those would
  // both double-enrich every business and risk crashing on file size, so they're excluded by
  // filename pattern rather than by content.
  const STAGING_FILE_PATTERN = /-bangalore-chennai-hyderabad\.csv$/i;

  const allFiles = fs
    .readdirSync(STAGING_DIR)
    .filter((f) => STAGING_FILE_PATTERN.test(f))
    .sort();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const startedAt = Date.now();
  const processed: FileReport[] = [];
  const skipped: string[] = [];
  let totalRows = 0;
  let totalWarnings = 0;

  const milestoneEvery = Math.max(1, Math.min(20, Math.ceil(allFiles.length * 0.05)));

  allFiles.forEach((file, i) => {
    const inputPath = path.join(STAGING_DIR, file);

    // Peek at just the header before loading the whole file — a few of the files in this
    // directory are multi-hundred-MB aggregate/master CSVs (e.g. businesses.csv, actively
    // being appended to by the still-running scraper), not per-subcategory staging files,
    // and reading them whole can exceed Node's max string length.
    const headerLine = readFirstLine(inputPath);
    if (!headerLine || !headerLine.split(",").includes("source_subcategory")) {
      skipped.push(file);
      return;
    }

    const text = fs.readFileSync(inputPath, "utf8");
    const rows = parseCsv(text);

    if (rows.length === 0) {
      skipped.push(file);
      return;
    }

    const enriched = rows.map((row) => ({ ...row, ...enrichRow(row.source_subcategory ?? "", pools) }));
    const warnings = enriched.filter((r) => r.enrichment_warning).length;

    const columns = [...Object.keys(rows[0]), ...ENRICHMENT_COLUMNS];
    fs.writeFileSync(path.join(OUTPUT_DIR, file), stringifyCsv(columns, enriched), "utf8");

    processed.push({ file, rows: rows.length, warnings });
    totalRows += rows.length;
    totalWarnings += warnings;

    const done = i + 1;
    if (done % milestoneEvery === 0 || done === allFiles.length) {
      const pct = ((done / allFiles.length) * 100).toFixed(1);
      console.log(
        `MILESTONE [${done}/${allFiles.length} ${pct}%] files_processed=${processed.length} ` +
          `files_skipped=${skipped.length} rows_enriched=${totalRows} warnings=${totalWarnings} | last=${file}`,
      );
    }
  });

  const durationMs = Date.now() - startedAt;

  console.log("\n================ CSV ENRICHMENT COMPLETE ================");
  console.log(`Files processed      : ${processed.length}`);
  console.log(`Files skipped (non-staging schema): ${skipped.length}`);
  if (skipped.length > 0) console.log(`  Skipped: ${skipped.join(", ")}`);
  console.log(`Total rows enriched   : ${totalRows}`);
  console.log(`Rows with a warning   : ${totalWarnings}`);
  console.log(`Time taken            : ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`Output dir            : ${OUTPUT_DIR}`);
  console.log("===========================================================");
}

main();
