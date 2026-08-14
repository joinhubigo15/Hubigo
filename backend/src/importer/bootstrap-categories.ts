/**
 * One-time taxonomy bootstrap — NOT run by the importer itself. Upserts the real
 * sector -> subcategory Category tree from hubigo/Categories_Updated.xlsx (the same
 * taxonomy file the Pixabay image-sourcing pipeline uses), so Category.slug lines up with
 * the Pixabay placeholder-image folder names.
 *
 * Safe to re-run: upserts by slug, matching the non-destructive pattern prisma/seed.ts
 * already uses. Run manually before importing:
 *   npx tsx src/importer/bootstrap-categories.ts
 */
import path from "node:path";
import XLSX from "xlsx";
import { prisma } from "../lib/prisma";
import { canonicalSubcategoryName, slugify, SKIP_SUBCATEGORIES } from "./category-mapper/taxonomy-slug";

const XLSX_PATH = path.join(__dirname, "../../../Categories_Updated.xlsx");

interface SheetRow {
  sector: string;
  subcategory: string;
}

function loadTaxonomy(): SheetRow[] {
  const wb = XLSX.readFile(XLSX_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const header = (rows[0] ?? []).map((h) => String(h ?? "").trim().toLowerCase());
  const sectorCol = header.findIndex((h) => h === "sector");
  const subcategoryCol = header.findIndex((h) => h === "subcategory");
  if (sectorCol === -1 || subcategoryCol === -1) {
    throw new Error(`Could not find "Sector"/"Subcategory" columns in ${XLSX_PATH}`);
  }

  const seen = new Set<string>();
  const out: SheetRow[] = [];
  for (const row of rows.slice(1)) {
    const rawSubcategory = row?.[subcategoryCol];
    const rawSector = row?.[sectorCol];
    if (typeof rawSubcategory !== "string" || !rawSubcategory.trim()) continue;
    if (typeof rawSector !== "string" || !rawSector.trim()) continue;

    const name = canonicalSubcategoryName(rawSubcategory);
    const key = name.toLowerCase();
    if (SKIP_SUBCATEGORIES.has(key) || seen.has(key)) continue;
    seen.add(key);

    out.push({ sector: rawSector.trim(), subcategory: name });
  }
  return out;
}

async function main() {
  const rows = loadTaxonomy();
  const sectors = [...new Set(rows.map((r) => r.sector))];

  const sectorIds = new Map<string, string>();
  for (const sector of sectors) {
    const slug = slugify(sector);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: sector },
      create: { name: sector, slug },
    });
    sectorIds.set(sector, category.id);
  }
  console.log(`Upserted ${sectors.length} sector categories.`);

  let subcategoryCount = 0;
  for (const row of rows) {
    const parentId = sectorIds.get(row.sector);
    if (!parentId) continue; // unreachable given sectors is derived from rows, but keeps this defensive
    const slug = slugify(row.subcategory);
    await prisma.category.upsert({
      where: { slug },
      update: { name: row.subcategory, parentId },
      create: { name: row.subcategory, slug, parentId },
    });
    subcategoryCount++;
  }
  console.log(`Upserted ${subcategoryCount} subcategory categories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
