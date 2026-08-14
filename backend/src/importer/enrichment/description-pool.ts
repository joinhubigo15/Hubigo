import fs from "node:fs";
import path from "node:path";

const TEMPLATES_DIR = path.join(__dirname, "../../../prisma/description-templates");

interface TemplateEntry {
  subcategorySlug: string;
  subcategoryName: string;
  descriptions: string[];
}

/**
 * Local (no-DB) equivalent of BusinessDescriptionTemplate, read straight from the same static
 * JSON files scripts/seed-description-templates.ts seeds into the DB. Used at CSV-enrichment
 * time, before any database is even reachable.
 */
export class DescriptionPool {
  private bySlug = new Map<string, string[]>();

  private constructor(bySlug: Map<string, string[]>) {
    this.bySlug = bySlug;
  }

  static load(): DescriptionPool {
    const bySlug = new Map<string, string[]>();
    const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const entries: TemplateEntry[] = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf8"));
      for (const entry of entries) {
        bySlug.set(entry.subcategorySlug, entry.descriptions);
      }
    }
    return new DescriptionPool(bySlug);
  }

  pickRandom(subcategorySlug: string): string | null {
    const pool = this.bySlug.get(subcategorySlug);
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  get size(): number {
    return this.bySlug.size;
  }
}
