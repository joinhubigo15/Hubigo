import fs from "node:fs";
import path from "node:path";

const COMMON_SERVICES_DIR = path.join(__dirname, "../../../prisma/common-services");

export interface CommonServiceEntry {
  name: string;
  description: string;
  icon: string;
}

interface PoolFileEntry {
  subcategorySlug: string;
  subcategoryName: string;
  services: CommonServiceEntry[];
}

/**
 * Reads prisma/common-services/*.json directly at import time — no DB seed table needed for
 * this pool (unlike descriptions), since it's small and only ever read at DB-insert time by
 * the importer. 3 services per subcategory, attached as BusinessService rows.
 */
export function loadCommonServicesPool(): Map<string, CommonServiceEntry[]> {
  const bySlug = new Map<string, CommonServiceEntry[]>();
  const files = fs.readdirSync(COMMON_SERVICES_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const entries: PoolFileEntry[] = JSON.parse(fs.readFileSync(path.join(COMMON_SERVICES_DIR, file), "utf8"));
    for (const entry of entries) {
      bySlug.set(entry.subcategorySlug, entry.services);
    }
  }
  return bySlug;
}
