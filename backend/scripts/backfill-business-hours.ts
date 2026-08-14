import { prisma } from "../src/lib/prisma";
import { parseWeeklyHoursFromRaw } from "../src/utils/business-hours";

// business_hours (structured) is now the single source of truth for open/closed status —
// see business.repository.ts's is_open_now CASE and business-hours.ts's computeOpenStatus.
// This one-time backfill parses each business's scraper-provided openHoursRaw JSON text
// (e.g. '{"Monday":["11 AM–10 PM"]}') into real BusinessHours rows so the imported dataset
// (which never had structured hours) gets a real, database-backed open/closed signal instead
// of showing "hours unavailable" for every business. A business whose raw text is missing or
// unparseable is deliberately left with zero BusinessHours rows — the app already treats that
// as "hours unavailable" (isOpenNow: null), which is the honest answer, not a guess.
//
// Idempotent: uses skipDuplicates, so re-running never overwrites hours a real user (or the
// business-register wizard) already entered manually for a business.

const BATCH_SIZE = 2000;

async function main() {
  let cursor: string | undefined;
  let processed = 0;
  let parsedCount = 0;
  let unparseableCount = 0;
  let inferredSingleDayCount = 0;
  let rowsInserted = 0;

  for (;;) {
    const businesses = await prisma.business.findMany({
      // hours: { none: {} } skips businesses that already have BusinessHours rows — makes a
      // resumed run efficient (no rescanning already-done businesses) instead of relying on
      // skipDuplicates alone, which still requires fetching+parsing every already-done row.
      where: { openHoursRaw: { not: null }, hours: { none: {} } },
      select: { id: true, openHoursRaw: true },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
    });

    if (businesses.length === 0) break;

    const rows: { businessId: string; day: string; openTime: string | null; closeTime: string | null; isClosed: boolean }[] = [];

    for (const b of businesses) {
      const weekly = parseWeeklyHoursFromRaw(b.openHoursRaw);
      if (!weekly) {
        unparseableCount++;
        continue;
      }
      parsedCount++;
      if (weekly.inferredFromSingleDay) inferredSingleDayCount++;
      for (const row of weekly.rows) {
        rows.push({
          businessId: b.id,
          day: row.day,
          openTime: row.openTime,
          closeTime: row.closeTime,
          isClosed: row.isClosed,
        });
      }
    }

    if (rows.length > 0) {
      const result = await prisma.businessHours.createMany({ data: rows as any, skipDuplicates: true });
      rowsInserted += result.count;
    }

    processed += businesses.length;
    cursor = businesses[businesses.length - 1].id;
    console.log(`Processed ${processed} businesses so far (${rowsInserted} hour-rows inserted)...`);
  }

  console.log("\nDone.");
  console.log(`  Businesses with raw hours text: ${processed}`);
  console.log(`  Successfully parsed:            ${parsedCount}`);
  console.log(`  Unparseable/empty:               ${unparseableCount}`);
  console.log(`  Inferred from a single known day (flagged, not full-week accurate): ${inferredSingleDayCount}`);
  console.log(`  BusinessHours rows inserted:     ${rowsInserted}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
