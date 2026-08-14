/**
 * Produces a deduplicated, triaged deliverable from the raw staging CSV:
 *   - clean-leads.csv       — one row per unique business (by dedup_key), has phone or email,
 *                             not permanently closed. The main outreach-ready deliverable.
 *   - closed-businesses.csv — permanently-closed businesses, kept for reference, not deleted.
 *   - no-contact-leads.csv  — no phone AND no email, unusable for outreach but still valid data.
 *
 * Streams businesses.csv the same way build-subcategory-csv.ts does (chunk-based RFC4180 parser)
 * so memory stays flat regardless of file size — the file is 420K+ rows and growing.
 *
 * Dedup: keyed on dedup_key (place_id, falling back to cid/data_id, computed at staging time).
 * Retried queries appended duplicate rows over the day without removing the old ones, so the same
 * dedup_key can appear multiple times. When duplicates collide, the row with more contact info
 * (phone/email present) wins; ties keep the first-seen row. Rows with no dedup_key (Google
 * returned no place_id/cid/data_id at all) can't be safely deduped against anything else, so each
 * one is kept as-is under a synthetic unique key.
 */
import { createReadStream, openSync, closeSync, writeSync } from "node:fs";
import { toCsvLine } from "./csv";
import { STAGING_COLUMNS } from "./types";

const inPath = "scripts/gmaps-scraper/staging/businesses.csv";
const outDir = "scripts/gmaps-scraper/staging";

let header: string[] | undefined;
const byDedupKey = new Map<string, Record<string, string>>();
let syntheticCounter = 0;
let totalRows = 0;

function completeness(record: Record<string, string>): number {
  let score = 0;
  if ((record.phone || "").trim()) score += 1;
  if ((record.emails || "").trim()) score += 1;
  return score;
}

function handleRow(row: string[]): void {
  if (header === undefined) {
    header = row;
    return;
  }
  totalRows++;
  const record: Record<string, string> = {};
  header.forEach((col, i) => {
    record[col] = row[i] ?? "";
  });

  const key = (record.dedup_key || "").trim() || `__no_key_${syntheticCounter++}`;
  const existing = byDedupKey.get(key);
  if (!existing || completeness(record) > completeness(existing)) {
    byDedupKey.set(key, record);
  }
}

let row: string[] = [];
let field = "";
let inQuotes = false;
let sawAnyContent = false;

function consumeChunk(text: string): void {
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    sawAnyContent = true;

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      if (!(row.length === 1 && row[0] === "")) handleRow(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
}

async function main() {
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(inPath, { encoding: "utf-8", highWaterMark: 1024 * 1024 });
    stream.on("data", (chunk) => consumeChunk(chunk as string));
    stream.on("end", () => {
      if (sawAnyContent && (field.length > 0 || row.length > 0)) {
        row.push(field);
        handleRow(row);
      }
      resolve();
    });
    stream.on("error", reject);
  });

  const cleanFd = openSync(`${outDir}/clean-leads.csv`, "w");
  const closedFd = openSync(`${outDir}/closed-businesses.csv`, "w");
  const noContactFd = openSync(`${outDir}/no-contact-leads.csv`, "w");
  writeSync(cleanFd, toCsvLine([...STAGING_COLUMNS]));
  writeSync(closedFd, toCsvLine([...STAGING_COLUMNS]));
  writeSync(noContactFd, toCsvLine([...STAGING_COLUMNS]));

  let cleanCount = 0;
  let closedCount = 0;
  let noContactCount = 0;

  for (const record of byDedupKey.values()) {
    const line = toCsvLine(STAGING_COLUMNS.map((c) => record[c] ?? ""));
    if ((record.is_permanently_closed || "").trim().toLowerCase() === "true") {
      writeSync(closedFd, line);
      closedCount++;
      continue;
    }
    const hasContact = (record.phone || "").trim() || (record.emails || "").trim();
    if (!hasContact) {
      writeSync(noContactFd, line);
      noContactCount++;
      continue;
    }
    writeSync(cleanFd, line);
    cleanCount++;
  }

  closeSync(cleanFd);
  closeSync(closedFd);
  closeSync(noContactFd);

  console.log(
    JSON.stringify(
      {
        totalRowsRead: totalRows,
        uniqueBusinesses: byDedupKey.size,
        duplicatesRemoved: totalRows - byDedupKey.size,
        cleanLeads: cleanCount,
        closedBusinesses: closedCount,
        noContactLeads: noContactCount,
      },
      null,
      2,
    ),
  );
}

main();
