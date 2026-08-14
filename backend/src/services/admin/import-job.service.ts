import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parseCsv } from "../../importer/parser/csv";
import { cleanRow } from "../../importer/cleaner/clean-text";
import { validateBusiness } from "../../importer/validator/validate-business";
import { normalizeName } from "../../importer/normalizer/normalize-name";
import { normalizePhoneForMatching } from "../../importer/normalizer/normalize-phone";
import { normalizeWebsite } from "../../importer/normalizer/normalize-website";
import { normalizeAddress, extractPincode } from "../../importer/normalizer/normalize-address";
import { normalizeCoordinates } from "../../importer/normalizer/normalize-coordinates";
import { normalizeRating } from "../../importer/normalizer/normalize-rating";
import { CategoryResolver } from "../../importer/category-mapper/resolve";
import { canonicalSubcategoryName } from "../../importer/category-mapper/taxonomy-slug";
import { generateBusinessSlug } from "../../importer/utils/slug";
import type { RawRow } from "../../importer/types";

// backend/src/services/admin -> backend/uploads/imports (three levels up from this file),
// same relative-path convention as common-services-pool.ts's COMMON_SERVICES_DIR.
const IMPORTS_DIR = path.join(__dirname, "../../../uploads/imports");

const PROGRESS_WRITE_INTERVAL = 200;

export async function createImportJob(file: Express.Multer.File, sector: string | undefined, createdBy: string) {
  fs.mkdirSync(IMPORTS_DIR, { recursive: true });
  const storedPath = path.join(IMPORTS_DIR, `${crypto.randomUUID()}.csv`);
  fs.writeFileSync(storedPath, file.buffer);

  return prisma.importJob.create({
    data: {
      filename: file.originalname,
      storedPath,
      sector,
      status: "PENDING",
      createdBy,
    },
  });
}

export async function listImportJobs() {
  return prisma.importJob.findMany({ orderBy: { createdAt: "desc" } });
}

export async function retryImportJob(id: string) {
  const job = await prisma.importJob.findUnique({ where: { id } });
  if (!job) throw ApiError.notFound("Import job not found");
  if (job.status !== "FAILED") throw ApiError.conflict("Only failed import jobs can be retried");

  return prisma.importJob.update({
    where: { id },
    data: { processedRows: 0, insertedRows: 0, duplicateRows: 0, failedRows: 0, errorMessage: null },
  });
}

/**
 * A simplified, single-file, DB-only variant of backend/src/importer/cli.ts — reuses its
 * exact parse/clean/validate/normalize/category-resolve building blocks, but skips the
 * cleaned-data CSV export and cross-file dedup index (this only ever processes one CSV per
 * job, and per-row externalPlaceId lookups handle duplicates well enough at this scale).
 */
export async function runImportJob(jobId: string): Promise<void> {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {
    await prisma.importJob.update({ where: { id: jobId }, data: { status: "RUNNING", startedAt: new Date() } });

    const text = fs.readFileSync(job.storedPath, "utf-8");
    const rows = parseCsv(text);
    await prisma.importJob.update({ where: { id: jobId }, data: { totalRows: rows.length } });

    const categoryResolver = await CategoryResolver.load();
    const cities = await prisma.city.findMany({ select: { id: true, slug: true } });
    const cityIdBySlug = new Map(cities.map((c) => [c.slug, c.id] as const));

    let processedRows = 0;
    let insertedRows = 0;
    let duplicateRows = 0;
    let failedRows = 0;

    for (const rawRow of rows) {
      processedRows++;

      try {
        const row = cleanRow(rawRow as RawRow);
        const address = normalizeAddress(row.address || row.complete_address);
        const validation = validateBusiness(address);
        if (!validation.ok) {
          failedRows++;
          continue;
        }

        const citySlug = row.source_city?.trim().toLowerCase();
        const cityId = citySlug ? cityIdBySlug.get(citySlug) : undefined;
        if (!cityId) {
          failedRows++;
          continue;
        }

        if (row.dedup_key) {
          const duplicate = await prisma.business.findFirst({ where: { externalPlaceId: row.dedup_key } });
          if (duplicate) {
            duplicateRows++;
            continue;
          }
        }

        const { lat, lng } = normalizeCoordinates(row.latitude, row.longitude);
        const { avgRating, reviewCount } = normalizeRating(row.review_rating, row.review_count);
        const pincode = extractPincode(row.address, row.complete_address, row.source_location);
        const phone = row.phone ? normalizePhoneForMatching(row.phone) : null;
        const website = row.website ? normalizeWebsite(row.website) : null;
        const name = normalizeName(row.title);
        const categoryId = row.source_subcategory
          ? categoryResolver.resolve(canonicalSubcategoryName(row.source_subcategory))
          : null;

        await prisma.business.create({
          data: {
            name,
            slug: generateBusinessSlug(name, citySlug!),
            description: row.description?.trim() || null,
            address,
            pincode,
            cityId,
            lat,
            lng,
            phone,
            website,
            avgRating,
            reviewCount,
            openHoursRaw: row.open_hours || null,
            externalPlaceId: row.dedup_key || null,
            ...(categoryId && { categories: { create: { categoryId, isPrimary: true } } }),
          },
        });
        insertedRows++;
      } catch {
        // Keep going on a per-row DB error — one bad row must never abort the whole job.
        failedRows++;
      }

      if (processedRows % PROGRESS_WRITE_INTERVAL === 0) {
        await prisma.importJob.update({
          where: { id: jobId },
          data: { processedRows, insertedRows, duplicateRows, failedRows },
        });
      }
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        processedRows,
        insertedRows,
        duplicateRows,
        failedRows,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: String(err), completedAt: new Date() },
    });
  }
}
