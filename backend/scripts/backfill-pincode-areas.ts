import path from "path";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

// Source: C:\Hubigo\Documentation\Hubigo_PinToArea.xlsx, sheet "Master List" with columns
// City | PIN code | Main area | Alternate areas/localities. One pincode can produce a "primary"
// PincodeArea row (Main area) plus one or more "alternate" rows — each real area name gets its
// own pSEO page (see pseo.service.ts's getAreaCategoryCombos comment).
const XLSX_PATH = path.join("C:", "Hubigo", "Documentation", "Hubigo_PinToArea.xlsx");

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SourceRow {
  City: string;
  "PIN code": string | number;
  "Main area": string;
  "Alternate areas/localities"?: string | null;
}

async function main() {
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = workbook.Sheets["Master List"];
  if (!sheet) throw new Error(`"Master List" sheet not found in ${XLSX_PATH}`);
  const rows = XLSX.utils.sheet_to_json<SourceRow>(sheet);

  const cities = await prisma.city.findMany({ select: { id: true, name: true } });
  const cityIdByName = new Map(cities.map((c) => [c.name, c.id]));

  type AreaRecord = { cityId: string; pincode: string; name: string; slug: string; isPrimary: boolean };
  const records: AreaRecord[] = [];
  const skippedCities = new Set<string>();

  for (const row of rows) {
    const cityName = String(row.City ?? "").trim();
    const pincode = String(row["PIN code"] ?? "").trim();
    const mainArea = String(row["Main area"] ?? "").trim();
    if (!cityName || !pincode || !mainArea) continue;

    const cityId = cityIdByName.get(cityName);
    if (!cityId) {
      skippedCities.add(cityName);
      continue;
    }

    records.push({ cityId, pincode, name: mainArea, slug: slugify(mainArea), isPrimary: true });

    const alternates = String(row["Alternate areas/localities"] ?? "").trim();
    if (alternates) {
      // "CBD / MG Road" style cell: split on "/" into individual alternate area names.
      for (const alt of alternates.split("/").map((s) => s.trim()).filter(Boolean)) {
        records.push({ cityId, pincode, name: alt, slug: slugify(alt), isPrimary: false });
      }
    }
  }

  if (skippedCities.size > 0) {
    console.warn(`Skipped rows for cities not in the DB: ${[...skippedCities].join(", ")}`);
  }

  // De-dupe on the table's real unique key [pincode, slug] — the same area name can recur as an
  // alternate for more than one pincode row in the source sheet.
  const dedupedByKey = new Map(records.map((r) => [`${r.pincode}::${r.slug}`, r]));
  const deduped = [...dedupedByKey.values()];

  console.log(`Parsed ${rows.length} source rows -> ${deduped.length} unique (pincode, slug) area rows.`);

  for (const rec of deduped) {
    await prisma.pincodeArea.upsert({
      where: { pincode_slug: { pincode: rec.pincode, slug: rec.slug } },
      create: rec,
      update: { name: rec.name, isPrimary: rec.isPrimary, cityId: rec.cityId },
    });
  }

  const total = await prisma.pincodeArea.count();
  console.log(`Upserted ${deduped.length} rows. pincode_areas now has ${total} total rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
