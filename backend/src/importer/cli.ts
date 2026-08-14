import { readFileSync } from "node:fs";
import { prisma } from "../lib/prisma";
import type { NormalizedBusiness, RawRow, ImportSummary } from "./types";
import { walkInput } from "./parser/walk-input";
import { parseCsv } from "./parser/csv";
import { cleanRow } from "./cleaner/clean-text";
import { validateBusiness } from "./validator/validate-business";
import { normalizeName } from "./normalizer/normalize-name";
import { normalizePhoneForMatching } from "./normalizer/normalize-phone";
import { normalizeWebsite } from "./normalizer/normalize-website";
import { normalizeAddress, extractPincode } from "./normalizer/normalize-address";
import { normalizeCoordinates } from "./normalizer/normalize-coordinates";
import { normalizeRating } from "./normalizer/normalize-rating";
import { CategoryResolver } from "./category-mapper/resolve";
import { canonicalSubcategoryName } from "./category-mapper/taxonomy-slug";
import { DedupIndex } from "./deduplicator/dedup-index";
import { writeBusinesses } from "./upsert/business-writer";
import { loadCommonServicesPool } from "./services/common-services-pool";
import { writeCleanedDataFiles, CLEANED_DATA_DIR } from "./exporter/cleaned-csv-writer";
import { ImportLogger } from "./utils/logger";

interface CliOptions {
  input: string;
  dryRun: boolean;
  batchSize: number;
  insertDb: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  let input: string | undefined;
  let dryRun = false;
  let batchSize = 500;
  let insertDb = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input") input = argv[++i];
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--batch-size") batchSize = Number(argv[++i]);
    else if (arg === "--insert-db") insertDb = true;
  }

  if (!input) {
    throw new Error(
      "Usage: tsx src/importer/cli.ts --input <file|directory> [--insert-db] [--dry-run] [--batch-size N]\n" +
        "By default this only writes cleaned per-subcategory CSVs to backend/cleaned-data/ — pass --insert-db to also write to Postgres.",
    );
  }
  if (!Number.isFinite(batchSize) || batchSize <= 0) {
    throw new Error("--batch-size must be a positive number");
  }

  return { input, dryRun, batchSize, insertDb };
}

function toNormalizedBusiness(
  row: RawRow,
  sourceFile: string,
  sourceRowNumber: number,
): { business: NormalizedBusiness | null; rejectReason?: string } {
  const address = normalizeAddress(row.address || row.complete_address);
  const validation = validateBusiness(address);
  if (!validation.ok) {
    return { business: null, rejectReason: validation.reason };
  }

  const { lat, lng } = normalizeCoordinates(row.latitude, row.longitude);
  const { avgRating, reviewCount } = normalizeRating(row.review_rating, row.review_count);
  const pincode = extractPincode(row.address, row.complete_address, row.source_location);
  const citySlug = row.source_city.trim().toLowerCase();

  const business: NormalizedBusiness = {
    name: normalizeName(row.title),
    address,
    pincode,
    citySlug,
    lat,
    lng,
    phone: row.phone ? normalizePhoneForMatching(row.phone) : null,
    website: row.website ? normalizeWebsite(row.website) : null,
    avgRating,
    reviewCount,
    openHoursRaw: row.open_hours || null,
    externalPlaceId: row.dedup_key || null,
    sourceSubcategory: canonicalSubcategoryName(row.source_subcategory),
    sourceCategoryText: row.category?.trim() ?? "",
    sourceFile,
    sourceRowNumber,

    description: row.description?.trim() || null,
    coverImageKey: row.cover_image_key?.trim() || null,
    galleryImageKeys: row.gallery_image_keys ? row.gallery_image_keys.split("|").filter(Boolean) : [],
    badgeImageKey: row.badge_image_key?.trim() || null,
  };

  return { business };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const logger = new ImportLogger();

  const files = walkInput(opts.input);
  if (files.length === 0) {
    console.log("No CSV files found at the given input path.");
    return;
  }
  console.log(`Found ${files.length} CSV file(s).`);

  const [categoryResolver, cities] = await Promise.all([
    CategoryResolver.load(),
    prisma.city.findMany({ select: { id: true, slug: true } }),
  ]);
  const servicesBySlug = loadCommonServicesPool();
  console.log(
    `Loaded ${categoryResolver.size} categories, ${cities.length} cities, ${servicesBySlug.size} common-service subcategory pools.`,
  );

  const cityIdBySlug = new Map(cities.map((c) => [c.slug, c.id] as const));
  const dedupIndex = new DedupIndex();

  const summary: ImportSummary = {
    csvsProcessed: 0,
    rowsRead: 0,
    businessesInserted: 0,
    businessesSkippedExisting: 0,
    duplicatesMerged: 0,
    rejectedMissingAddress: 0,
    categoryUnresolved: 0,
    errors: 0,
    executionMs: 0,
    cleanedFilesWritten: 0,
    cleanedRowsWritten: 0,
  };

  for (let f = 0; f < files.length; f++) {
    const file = files[f];
    logger.file(f + 1, files.length, file);

    let rows: Record<string, string>[];
    try {
      const text = readFileSync(file, "utf-8");
      rows = parseCsv(text);
    } catch (err) {
      logger.error(`failed to read/parse ${file}: ${(err as Error).message}`);
      summary.errors++;
      continue;
    }

    for (let r = 0; r < rows.length; r++) {
      summary.rowsRead++;
      const raw = cleanRow(rows[r] as RawRow);

      const { business, rejectReason } = toNormalizedBusiness(raw, file, r + 2); // +2: header row + 1-indexing
      if (!business) {
        if (rejectReason === "missing_address") summary.rejectedMissingAddress++;
        continue;
      }

      const categoryId = categoryResolver.resolve(business.sourceSubcategory);
      if (!categoryId) summary.categoryUnresolved++;
      const sectorId = categoryId ? categoryResolver.topLevelSectorOf(categoryId) : null;

      dedupIndex.add(business, categoryId, sectorId);
    }

    summary.csvsProcessed++;
    logger.progress(summary.rowsRead, dedupIndex.uniqueCount, dedupIndex.duplicatesMerged, summary.rejectedMissingAddress);
  }

  summary.duplicatesMerged = dedupIndex.duplicatesMerged;

  if (categoryResolver.unresolved.length > 0) {
    logger.warn(`unresolved source_subcategory values (run bootstrap-categories.ts if these are new): ${categoryResolver.unresolved.join(", ")}`);
  }

  console.log(`\nWriting ${dedupIndex.uniqueCount} unique businesses to cleaned-data/ (one CSV per subcategory)...`);
  const exportResult = writeCleanedDataFiles(dedupIndex.all, categoryResolver);
  summary.cleanedFilesWritten = exportResult.filesWritten;
  summary.cleanedRowsWritten = exportResult.rowsWritten;
  console.log(`Wrote ${exportResult.filesWritten} file(s) to ${CLEANED_DATA_DIR}`);

  if (opts.insertDb) {
    console.log(`\n${opts.dryRun ? "[dry-run] " : ""}Writing ${dedupIndex.uniqueCount} unique businesses to the database...`);
    const writeResult = await writeBusinesses(dedupIndex.all, cityIdBySlug, categoryResolver, servicesBySlug, opts, logger);
    summary.businessesInserted = writeResult.inserted;
    summary.businessesSkippedExisting = writeResult.skippedExisting;
    summary.errors += writeResult.errors;
  } else {
    console.log("\n--insert-db not passed — skipping the database write (cleaned files only).");
  }

  summary.executionMs = logger.elapsedMs();
  logger.summary(summary);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
