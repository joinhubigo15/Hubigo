import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { prisma } from "../lib/prisma";
import { slugify } from "./category-mapper/taxonomy-slug";

const TAXONOMY_PATH = path.join(__dirname, "../../scripts/healthcare-taxonomy.json");

interface TaxonomyItem {
  category: string;
  subcategory: string;
  pdf_section?: string;
}

async function main() {
  if (!fs.existsSync(TAXONOMY_PATH)) {
    throw new Error(`Healthcare taxonomy file not found at ${TAXONOMY_PATH}`);
  }

  const items: TaxonomyItem[] = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));
  console.log(`Loaded ${items.length} items from healthcare-taxonomy.json`);

  // Group items by pdf_section (or default to "General Healthcare")
  const sectionMap = new Map<string, Set<string>>();
  for (const item of items) {
    const section = item.pdf_section?.trim() || "General Healthcare";
    const sub = item.subcategory?.trim();
    if (!sub) continue;

    if (!sectionMap.has(section)) {
      sectionMap.set(section, new Set());
    }
    sectionMap.get(section)!.add(sub);
  }

  console.log(`Found ${sectionMap.size} distinct healthcare sectors.`);

  // First, optional cleanup of non-healthcare categories if needed, or simply delete old categories without businesses
  // Clean old categories where parentId is null and not in healthcare sectors
  const allowedSectorSlugs = new Set<string>();
  for (const sectionName of sectionMap.keys()) {
    allowedSectorSlugs.add(slugify(sectionName));
  }

  // Delete non-healthcare parent categories and their subcategories
  const existingSectors = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
  });

  for (const sector of existingSectors) {
    if (!allowedSectorSlugs.has(sector.slug)) {
      console.log(`Removing old non-healthcare category: ${sector.name} (${sector.slug})`);
      // Delete businessCategories relations or children first
      const childIds = sector.children.map((c) => c.id);
      if (childIds.length > 0) {
        await prisma.businessCategory.deleteMany({
          where: { categoryId: { in: childIds } },
        });
        await prisma.category.deleteMany({
          where: { id: { in: childIds } },
        });
      }
      await prisma.businessCategory.deleteMany({
        where: { categoryId: sector.id },
      });
      await prisma.category.delete({
        where: { id: sector.id },
      });
    }
  }

  // Upsert Healthcare Sectors (Parents)
  const sectorIds = new Map<string, string>();
  for (const sectionName of sectionMap.keys()) {
    const slug = slugify(sectionName);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: sectionName, parentId: null },
      create: { name: sectionName, slug, parentId: null },
    });
    sectorIds.set(sectionName, category.id);
  }
  console.log(`Upserted ${sectionMap.size} Healthcare parent sectors.`);

  // Upsert Healthcare Subcategories
  let subcategoryCount = 0;
  for (const [sectionName, subcategories] of sectionMap.entries()) {
    const parentId = sectorIds.get(sectionName);
    if (!parentId) continue;

    for (const subName of subcategories) {
      const slug = slugify(subName);
      await prisma.category.upsert({
        where: { slug },
        update: { name: subName, parentId },
        create: { name: subName, slug, parentId },
      });
      subcategoryCount++;
    }
  }

  console.log(`Upserted ${subcategoryCount} Healthcare subcategories successfully!`);
}

main()
  .catch((err) => {
    console.error("Error bootstrapping healthcare categories:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
