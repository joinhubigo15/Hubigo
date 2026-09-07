import { getCategoriesDirect } from "../app/lib/business-direct";

async function main() {
  const cats = await getCategoriesDirect();
  console.log("Parent categories:", cats.map(c => ({ name: c.name, slug: c.slug })));
}

main();
