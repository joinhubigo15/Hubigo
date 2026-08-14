import { existsSync, mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCsv, toCsvLine } from "./csv";
import { STAGING_COLUMNS, STAGING_METADATA_COLUMNS, STAGING_RAW_COLUMNS } from "./types";
import type { QueryTask, RunSummaryRow } from "./types";

const STAGING_DIR = path.join(__dirname, "staging");
const BUSINESSES_CSV = path.join(STAGING_DIR, "businesses.csv");
const RUN_SUMMARY_CSV = path.join(STAGING_DIR, "run-summary.csv");

function ensureFileWithHeader(filePath: string, columns: readonly string[]): void {
  mkdirSync(STAGING_DIR, { recursive: true });
  if (!existsSync(filePath)) {
    writeFileSync(filePath, toCsvLine([...columns]), "utf-8");
  }
}

/**
 * A record is "incomplete" if it's missing all three of the fields most useful for later
 * dedup/import (name, address, phone) — matches the "don't drop anything, flag it" rule.
 * It's still staged either way.
 */
function isIncomplete(row: Record<string, string>): boolean {
  return !row.title?.trim() && !row.address?.trim() && !row.phone?.trim();
}

function isPermanentlyClosed(row: Record<string, string>): boolean {
  const status = (row.status ?? "").toUpperCase();
  return status.includes("CLOSED_PERMANENTLY") || status.includes("PERMANENTLY_CLOSED");
}

export function appendLeadsToStaging(task: QueryTask, searchQuery: string, csvText: string): number {
  ensureFileWithHeader(BUSINESSES_CSV, STAGING_COLUMNS);
  const rows = parseCsv(csvText);
  const stagedAt = new Date().toISOString();

  const lines = rows.map((row) => {
    // place_id is the documented dedup key but is frequently empty; cid and data_id are the
    // same kind of Google-internal identifier (hex pair) and one of them is reliably present —
    // which one varies by business category, so all three are tried in order.
    const dedupKey = row.place_id?.trim() || row.cid?.trim() || row.data_id?.trim() || "";
    const metadata: Record<string, string> = {
      staged_at: stagedAt,
      source_subcategory: task.subcategory,
      source_city: task.city,
      source_location: task.location,
      source_mode: task.mode,
      source_search_query: searchQuery,
      is_incomplete: String(isIncomplete(row)),
      is_permanently_closed: String(isPermanentlyClosed(row)),
      dedup_key: dedupKey,
    };
    const fullRow: Record<string, string> = { ...metadata };
    for (const col of STAGING_RAW_COLUMNS) {
      fullRow[col] = row[col] ?? "";
    }
    return toCsvLine([...STAGING_METADATA_COLUMNS, ...STAGING_RAW_COLUMNS].map((c) => fullRow[c] ?? ""));
  });

  appendFileSync(BUSINESSES_CSV, lines.join(""), "utf-8");
  return rows.length;
}

const RUN_SUMMARY_COLUMNS = [
  "timestamp",
  "subcategory",
  "city",
  "location",
  "mode",
  "creditsSpent",
  "leadCount",
  "status",
  "note",
] as const;

export function appendRunSummary(row: RunSummaryRow): void {
  ensureFileWithHeader(RUN_SUMMARY_CSV, RUN_SUMMARY_COLUMNS);
  appendFileSync(
    RUN_SUMMARY_CSV,
    toCsvLine([
      row.timestamp,
      row.subcategory,
      row.city,
      row.location,
      row.mode,
      String(row.creditsSpent),
      String(row.leadCount),
      row.status,
      row.note,
    ]),
    "utf-8",
  );
}

export function stagingPaths() {
  return { businessesCsv: BUSINESSES_CSV, runSummaryCsv: RUN_SUMMARY_CSV };
}
