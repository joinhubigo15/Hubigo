/** Usage: tsx log-subcategory-status.ts <sector> <subcategory> <outputFile> <action> */
import { readFileSync } from "node:fs";
import { parseCsv } from "./csv";
import { appendStatus } from "./subcategory-status";

const [, , sector, subcategory, outputFile, action] = process.argv;
if (!sector || !subcategory || !outputFile || !action) {
  console.error("Usage: tsx log-subcategory-status.ts <sector> <subcategory> <outputFile> <action>");
  process.exit(2);
}

let leadCount = 0;
if (action === "completed") {
  try {
    const rows = parseCsv(readFileSync(`scripts/gmaps-scraper/staging/${outputFile}`, "utf-8"));
    leadCount = rows.length;
  } catch {
    leadCount = 0;
  }
}

appendStatus({
  timestamp: new Date().toISOString(),
  sector,
  subcategory,
  leadCount,
  creditsSpent: Number(process.env.SUBCAT_CREDITS_SPENT ?? 0),
  outputFile,
  action: action as "completed" | "skipped-already-done",
});
console.log(`Logged: ${subcategory} (${action}), ${leadCount} leads`);
