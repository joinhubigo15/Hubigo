import { isSubcategoryComplete } from "./subcategory-status";
import data from "./data/category-priority.json";

const retail = (data as any[]).filter((d) => d.sector === "Retail Stores");
const done = retail.filter((d) => isSubcategoryComplete(d.subcategory));
console.log(`${done.length} / ${retail.length} Retail Stores subcategories complete`);
process.exit(done.length === retail.length ? 0 : 1);
