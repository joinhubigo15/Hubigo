/**
 * Prints the first subcategory (in the same priority order as list-remaining-subcategories.ts)
 * that isn't fully complete yet — i.e. whichever one run-category-batch.sh just stopped on.
 */
import { isSubcategoryComplete } from "./subcategory-status";
import data from "./data/category-priority.json";

const remaining = (data as any[]).sort((a, b) => a.priority - b.priority);

for (const d of remaining) {
  if (!isSubcategoryComplete(d.subcategory)) {
    console.log(d.subcategory);
    process.exit(0);
  }
}
process.exit(1);
