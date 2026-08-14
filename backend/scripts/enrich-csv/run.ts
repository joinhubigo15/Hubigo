/**
 * Enriches a raw gmaps-scraper staging CSV with a description + storage KEYS (not URLs — the
 * storage provider is deliberately not this step's concern) for cover image, 3 gallery images,
 * and 1 badge image, all picked at random per business from its resolved subcategory's pool.
 *
 * Pure local/offline: no DB connection, no R2 API calls — reads only local JSON template pools
 * and local image folders (which mirror R2 key-for-key, since the bulk uploader preserves
 * folder structure exactly). Safe to run before, during, or after the R2 upload finishes.
 *
 * Usage (run from backend/):
 *   npx tsx scripts/enrich-csv/run.ts --input <file.csv> --output <file.csv>
 *   npx tsx scripts/enrich-csv/run.ts --input <file.csv> --limit 5   (dry preview, no file written)
 */
import fs from "node:fs";
import { parseCsv } from "../../src/importer/parser/csv";
import { stringifyCsv } from "../../src/importer/enrichment/csv-stringify";
import { enrichRow, ENRICHMENT_COLUMNS } from "../../src/importer/enrichment/enrich-row";
import { loadEnrichmentPools } from "../../src/importer/enrichment/load-pools";

interface Args {
  input: string;
  output: string | null;
  limit: number | null;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const get = (name: string) => raw.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  const input = get("input");
  if (!input) throw new Error("Missing --input=<file.csv>");
  return {
    input,
    output: get("output") ?? null,
    limit: get("limit") ? Number(get("limit")) : null,
  };
}

function main() {
  const args = parseArgs();
  const pools = loadEnrichmentPools();
  console.log(
    `Loaded pools: ${pools.descriptions.size} description subcategories, ` +
      `${pools.businessImagesByFolder.size} business-image folders, ${pools.badgeImagesByFolder.size} badge-image folders`,
  );

  const inputText = fs.readFileSync(args.input, "utf8");
  let rows = parseCsv(inputText);
  console.log(`Read ${rows.length} rows from ${args.input}`);

  if (args.limit) rows = rows.slice(0, args.limit);

  type EnrichedRow = Record<string, string> & ReturnType<typeof enrichRow>;
  const enriched: EnrichedRow[] = rows.map((row) => Object.assign({}, row, enrichRow(row.source_subcategory ?? "", pools)));

  if (!args.output) {
    console.log(`\n[preview] first ${enriched.length} enriched row(s):\n`);
    for (const row of enriched) {
      console.log({
        title: row.title,
        source_subcategory: row.source_subcategory,
        resolved_subcategory_slug: row.resolved_subcategory_slug,
        description: row.description,
        cover_image_key: row.cover_image_key,
        gallery_image_keys: row.gallery_image_keys,
        badge_image_key: row.badge_image_key,
        enrichment_warning: row.enrichment_warning,
      });
      console.log("---");
    }
    return;
  }

  const inputColumns = Object.keys(rows[0] ?? {});
  const outputColumns = [...inputColumns, ...ENRICHMENT_COLUMNS];
  const csvText = stringifyCsv(outputColumns, enriched);
  fs.writeFileSync(args.output, csvText, "utf8");
  console.log(`Wrote ${enriched.length} enriched rows to ${args.output}`);
}

main();
