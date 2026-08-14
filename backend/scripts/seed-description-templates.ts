/**
 * One-time seed — NOT run automatically. Reads the static JSON files under
 * prisma/description-templates/ (20 hand-written descriptions per subcategory,
 * no LLM calls at runtime) and loads them into BusinessDescriptionTemplate,
 * matching each entry's subcategorySlug against an existing Category row
 * (parentId not null). Idempotent: re-running clears and reinserts per
 * subcategory rather than accumulating duplicates.
 *
 * Requires src/importer/bootstrap-categories.ts to have already been run
 * against this database, since categories are looked up by slug, not created.
 *
 * Run manually:
 *   npx tsx scripts/seed-description-templates.ts
 */
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const TEMPLATES_DIR = path.join(__dirname, "../prisma/description-templates");

interface TemplateEntry {
  subcategorySlug: string;
  subcategoryName: string;
  descriptions: string[];
}

function loadTemplateEntries(): TemplateEntry[] {
  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".json"));
  const entries: TemplateEntry[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf8");
    entries.push(...(JSON.parse(raw) as TemplateEntry[]));
  }
  return entries;
}

async function main() {
  const entries = loadTemplateEntries();

  const slugs = entries.map((e) => e.subcategorySlug);
  const duplicateSlugs = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
  if (duplicateSlugs.length > 0) {
    throw new Error(`Duplicate subcategorySlug across JSON files: ${[...new Set(duplicateSlugs)].join(", ")}`);
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: slugs }, parentId: { not: null } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const missing = entries.filter((e) => !categoryBySlug.has(e.subcategorySlug));
  if (missing.length > 0) {
    console.warn(
      `Skipping ${missing.length} entr${missing.length === 1 ? "y" : "ies"} with no matching Category row: ` +
        missing.map((e) => e.subcategorySlug).join(", "),
    );
  }

  let seededSubcategories = 0;
  let seededDescriptions = 0;

  for (const entry of entries) {
    const subcategoryId = categoryBySlug.get(entry.subcategorySlug);
    if (!subcategoryId) continue;

    if (entry.descriptions.length !== 20) {
      console.warn(
        `${entry.subcategorySlug}: expected 20 descriptions, found ${entry.descriptions.length} — seeding anyway.`,
      );
    }

    await prisma.$transaction([
      prisma.businessDescriptionTemplate.deleteMany({ where: { subcategoryId } }),
      prisma.businessDescriptionTemplate.createMany({
        data: entry.descriptions.map((description) => ({ subcategoryId, description })),
      }),
    ]);

    seededSubcategories++;
    seededDescriptions += entry.descriptions.length;
  }

  console.log(
    `Seeded ${seededDescriptions} descriptions across ${seededSubcategories} subcategories ` +
      `(${missing.length} skipped for missing category).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
