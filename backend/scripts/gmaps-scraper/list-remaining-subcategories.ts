/** Prints the full remaining category-priority list (Retail Stores onward), sector by sector,
 * subcategory by priority, as lines the orchestrator shell script can read safely (handles
 * apostrophes/ampersands in names without bash quoting headaches). */
import categoryData from "./data/category-priority.json";

const START_SECTOR_RANK = 2; // Retail Stores — Food & Beverage (rank 1) is done.

interface CategoryRow {
  priority: number;
  sectorRank: number;
  sector: string;
  densityTier: string;
  subcategory: string;
}

const data = categoryData as CategoryRow[];
const remaining = data.filter((d) => d.sectorRank >= START_SECTOR_RANK).sort((a, b) => a.priority - b.priority);

let currentSector = "";
for (const row of remaining) {
  if (row.sector !== currentSector) {
    console.log(`SECTOR\t${row.sector}`);
    currentSector = row.sector;
  }
  console.log(`SUB\t${row.subcategory}`);
}
