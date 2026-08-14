import { isSubcategoryComplete } from "./subcategory-status";

const subcategory = process.argv[2];
if (!subcategory) {
  console.error("Usage: tsx check-subcategory-complete.ts <subcategory>");
  process.exit(2);
}
process.exit(isSubcategoryComplete(subcategory) ? 0 : 1);
