import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportWebsites() {
  console.log("Exporting all website URLs to local JSON file...");
  const listings = await prisma.business.findMany({
    where: {
      website: {
        not: null,
        not: "",
      },
    },
    select: {
      id: true,
      name: true,
      website: true,
      address: true,
      phone: true,
    },
  });

  const validExternal = listings.filter(
    (b) => b.website && !b.website.includes("hubigo.in") && !b.website.includes("findhubigo.com")
  );

  const outputPath = path.join(__dirname, "../../scratch/all_listings_websites.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(validExternal, null, 2));

  console.log(`Exported ${validExternal.length} valid external website listings to: ${outputPath}`);
  await prisma.$disconnect();
}

exportWebsites();
