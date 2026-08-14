import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import type { PendingBusiness } from "../deduplicator/dedup-index";
import type { CategoryResolver } from "../category-mapper/resolve";
import type { CommonServiceEntry } from "../services/common-services-pool";
import { generateBusinessSlug } from "../utils/slug";
import { chunk } from "../utils/chunk";
import { ImportLogger } from "../utils/logger";
import { withRetry } from "../utils/retry";

const RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 500;

export interface WriteResult {
  inserted: number;
  skippedExisting: number;
  errors: number;
}

interface BuiltBatch {
  businessRows: {
    id: string;
    slug: string;
    name: string;
    cityId: string;
    address: string;
    pincode: string | null;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    website: string | null;
    avgRating: number;
    reviewCount: number;
    openHoursRaw: string | null;
    externalPlaceId: string | null;
    keywords: string[];
    description: string | null;
    coverImageUrl: string | null;
  }[];
  categoryRows: { id: string; businessId: string; categoryId: string; isPrimary: boolean }[];
  mediaRows: { id: string; businessId: string; url: string; type: string; sortOrder: number }[];
  serviceRows: { id: string; businessId: string; name: string; description: string }[];
  skippedCount: number;
}

/**
 * Profiling a single row-at-a-time `business.create()` with nested writes showed 7 SQL round
 * trips per business, each costing ~500-600ms regardless of statement complexity — i.e. pure
 * Railway network RTT, not Prisma or app overhead (18.7ms of a 3.6s call). The fix is cutting
 * round trips, not per-call cost: batch N businesses into ONE transaction of 4 createMany()
 * calls (businesses, categories, media, services) — ~6 round trips total per BATCH instead of
 * per business. IDs are generated in application code (crypto.randomUUID()) so child rows can
 * reference their parent businessId without a per-row RETURNING round trip.
 *
 * Resumability: before building a batch's createMany payload, one SELECT checks which
 * externalPlaceIds in this batch already exist in the DB and excludes those businesses (and
 * all their children) entirely — safe to resume a stopped/failed run from any point without
 * creating duplicates. This only works for businesses with a dedup_key from the source data;
 * ~18 out of 336k in this dataset have none and would be re-inserted as new rows on a rerun —
 * an inherent data limitation (documented in dedup-index.ts), not something fixable here.
 */
export async function writeBusinesses(
  pending: PendingBusiness[],
  cityIdBySlug: Map<string, string>,
  categoryResolver: CategoryResolver,
  servicesBySlug: Map<string, CommonServiceEntry[]>,
  opts: { batchSize: number; dryRun: boolean },
  logger: ImportLogger,
): Promise<WriteResult> {
  let inserted = 0;
  let skippedExisting = 0;
  let errors = 0;

  const batches = chunk(pending, opts.batchSize);
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];

    const built = await withRetry(() => buildBatch(batch, cityIdBySlug, categoryResolver, servicesBySlug, logger), {
      attempts: RETRY_ATTEMPTS,
      baseDelayMs: RETRY_BASE_DELAY_MS,
      onRetry: (attempt, err) => {
        const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
        logger.warn(`retry ${attempt}/${RETRY_ATTEMPTS - 1} building batch ${b + 1}/${batches.length} after: ${message}`);
      },
    });
    skippedExisting += built.skippedCount;

    if (opts.dryRun) {
      inserted += built.businessRows.length;
      logger.progress(0, inserted, 0, 0);
      continue;
    }

    if (built.businessRows.length === 0) {
      logger.progress(0, inserted, 0, 0);
      continue;
    }

    try {
      await withRetry(() => writeBatchTransaction(built), {
        attempts: RETRY_ATTEMPTS,
        baseDelayMs: RETRY_BASE_DELAY_MS,
        onRetry: (attempt, err) => {
          const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
          logger.warn(`retry ${attempt}/${RETRY_ATTEMPTS - 1} for batch ${b + 1}/${batches.length} after: ${message}`);
        },
      });
      inserted += built.businessRows.length;
    } catch (err) {
      errors += built.businessRows.length;
      logger.error(`batch ${b + 1}/${batches.length} failed permanently: ${(err as Error).message}`);
    }

    logger.progress(0, inserted, 0, 0);
  }

  return { inserted, skippedExisting, errors };
}

async function buildBatch(
  batch: PendingBusiness[],
  cityIdBySlug: Map<string, string>,
  categoryResolver: CategoryResolver,
  servicesBySlug: Map<string, CommonServiceEntry[]>,
  logger: ImportLogger,
): Promise<BuiltBatch> {
  const businessRows: BuiltBatch["businessRows"] = [];
  const categoryRows: BuiltBatch["categoryRows"] = [];
  const mediaRows: BuiltBatch["mediaRows"] = [];
  const serviceRows: BuiltBatch["serviceRows"] = [];

  // Resumability pre-check: one SELECT for the whole batch, not one per business.
  const candidateExternalIds = batch.map((item) => item.business.externalPlaceId).filter((id): id is string => Boolean(id));
  const existing =
    candidateExternalIds.length > 0
      ? await prisma.business.findMany({
          where: { externalPlaceId: { in: candidateExternalIds } },
          select: { externalPlaceId: true },
        })
      : [];
  const existingIds = new Set(existing.map((e) => e.externalPlaceId));

  let skippedCount = 0;

  for (const item of batch) {
    const { business } = item;

    if (business.externalPlaceId && existingIds.has(business.externalPlaceId)) {
      skippedCount++;
      continue;
    }

    const cityId = cityIdBySlug.get(business.citySlug);
    if (!cityId) {
      logger.error(`unknown city slug "${business.citySlug}" (source: ${business.sourceFile}) — skipping business`);
      continue;
    }

    const businessId = crypto.randomUUID();
    const categoryIds = [...item.categoryIds];
    const keywords = business.sourceCategoryText ? [business.sourceCategoryText] : [];

    businessRows.push({
      id: businessId,
      slug: generateBusinessSlug(business.name, business.citySlug),
      name: business.name,
      cityId,
      address: business.address,
      pincode: business.pincode,
      lat: business.lat,
      lng: business.lng,
      phone: business.phone,
      website: business.website,
      avgRating: business.avgRating,
      reviewCount: business.reviewCount,
      openHoursRaw: business.openHoursRaw,
      externalPlaceId: business.externalPlaceId,
      keywords,
      description: business.description,
      coverImageUrl: business.coverImageKey,
    });

    for (let i = 0; i < categoryIds.length; i++) {
      categoryRows.push({ id: crypto.randomUUID(), businessId, categoryId: categoryIds[i], isPrimary: i === 0 });
    }

    business.galleryImageKeys.forEach((key, i) => {
      mediaRows.push({ id: crypto.randomUUID(), businessId, url: key, type: "image", sortOrder: i });
    });
    if (business.badgeImageKey) {
      mediaRows.push({ id: crypto.randomUUID(), businessId, url: business.badgeImageKey, type: "badge", sortOrder: 0 });
    }

    const primarySlug = categoryIds[0] ? categoryResolver.slugOf(categoryIds[0]) : null;
    const services = primarySlug ? (servicesBySlug.get(primarySlug) ?? []) : [];
    for (const s of services) {
      serviceRows.push({ id: crypto.randomUUID(), businessId, name: s.name, description: s.description });
    }
  }

  return { businessRows, categoryRows, mediaRows, serviceRows, skippedCount };
}

async function writeBatchTransaction(built: BuiltBatch): Promise<void> {
  await prisma.$transaction([
    prisma.business.createMany({ data: built.businessRows, skipDuplicates: true }),
    ...(built.categoryRows.length > 0 ? [prisma.businessCategory.createMany({ data: built.categoryRows })] : []),
    ...(built.mediaRows.length > 0 ? [prisma.businessMedia.createMany({ data: built.mediaRows })] : []),
    ...(built.serviceRows.length > 0 ? [prisma.businessService.createMany({ data: built.serviceRows })] : []),
  ]);
}
