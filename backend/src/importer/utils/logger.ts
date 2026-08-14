import type { ImportSummary } from "../types";

export class ImportLogger {
  private startedAt = Date.now();

  file(current: number, total: number, filePath: string): void {
    console.log(`\n[${current}/${total}] ${filePath}`);
  }

  progress(rowsRead: number, inserted: number, duplicates: number, rejected: number): void {
    console.log(
      `  rows read: ${rowsRead} | inserted so far: ${inserted} | duplicates merged: ${duplicates} | rejected: ${rejected}`,
    );
  }

  warn(message: string): void {
    console.warn(`  [warn] ${message}`);
  }

  error(message: string): void {
    console.error(`  [error] ${message}`);
  }

  summary(summary: ImportSummary): void {
    console.log("\n=== Import summary ===");
    console.log(`CSVs processed:            ${summary.csvsProcessed}`);
    console.log(`Rows read:                 ${summary.rowsRead}`);
    console.log(`Cleaned files written:     ${summary.cleanedFilesWritten}`);
    console.log(`Cleaned rows written:      ${summary.cleanedRowsWritten}`);
    console.log(`Businesses inserted (DB):  ${summary.businessesInserted}`);
    console.log(`Skipped (already in DB):  ${summary.businessesSkippedExisting}`);
    console.log(`Duplicates merged:         ${summary.duplicatesMerged}`);
    console.log(`Rejected (missing address):${summary.rejectedMissingAddress}`);
    console.log(`Category unresolved:       ${summary.categoryUnresolved}`);
    console.log(`Errors:                    ${summary.errors}`);
    console.log(`Execution time:            ${(summary.executionMs / 1000).toFixed(1)}s`);
  }

  elapsedMs(): number {
    return Date.now() - this.startedAt;
  }
}
