/**
 * One-time backfill: business_hours is empty for the entire imported dataset (only the scraper's
 * raw text ended up in Business.openHoursRaw — see src/utils/business-hours.ts's docstring). This
 * parses that raw text into real BusinessHours rows so the search page's "Open Now" filter (which
 * queries business_hours directly in SQL) has something to match against instead of always
 * returning zero results.
 *
 * Resumable: skips any business that already has BusinessHours rows, so a re-run after a partial
 * failure only processes what's left.
 *
 * Usage (run from backend/):
 *   npx tsx scripts/backfill-business-hours.ts
 */
import type { DayOfWeek } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { parseWeeklyHoursFromRaw } from "../src/utils/business-hours";

const BATCH_SIZE = 500;
const MAX_RETRIES = 30;

/** The Railway proxy connection drops mid-run occasionally (unrelated to this script) — retry
 * with backoff rather than losing the whole run to a transient blip. Outages have lasted longer
 * than a few seconds in practice, so this budgets up to several minutes of retrying (capped
 * per-attempt delay of 20s) before giving up. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 20000);
      console.log(`  transient error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delayMs}ms:`, (err as Error).message.split("\n")[0]);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

async function main() {
  let cursor: string | undefined;
  let processed = 0;
  let written = 0;
  let unparseable = 0;
  const startedAt = Date.now();

  for (;;) {
    const batch = await withRetry(() =>
      prisma.business.findMany({
        where: {
          openHoursRaw: { not: null },
          hours: { none: {} },
        },
        select: { id: true, openHoursRaw: true },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })
    );

    if (batch.length === 0) break;

    const rowsToInsert: { businessId: string; day: DayOfWeek; openTime: string | null; closeTime: string | null; isClosed: boolean }[] = [];

    for (const b of batch) {
      const weekly = parseWeeklyHoursFromRaw(b.openHoursRaw);
      processed++;
      if (!weekly) {
        unparseable++;
        continue;
      }
      for (const row of weekly.rows) {
        rowsToInsert.push({ businessId: b.id, day: row.day, openTime: row.openTime, closeTime: row.closeTime, isClosed: row.isClosed });
      }
    }

    if (rowsToInsert.length > 0) {
      const result = await withRetry(() => prisma.businessHours.createMany({ data: rowsToInsert, skipDuplicates: true }));
      written += result.count;
    }

    cursor = batch[batch.length - 1].id;

    if (processed % 5000 < BATCH_SIZE) {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`processed ${processed} businesses, wrote ${written} hour-rows, ${unparseable} unparseable — ${elapsedSec}s elapsed`);
    }
  }

  console.log(`\nDone. Processed ${processed} businesses, wrote ${written} BusinessHours rows, ${unparseable} had unparseable raw hours.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
