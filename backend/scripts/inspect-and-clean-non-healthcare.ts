import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const NON_HEALTHCARE_KEYWORDS = [
  "hotel",
  "restaurant",
  "resort",
  "cafe",
  "bakery",
  "saree",
  "textile",
  "jewell",
  "electronics",
  "auto",
  "motors",
  "travels",
  "cabs",
  "real estate",
  "furniture",
  "footwear",
  "tailor",
  "bar",
  "pub", "wine",
  "liquor",
  "supermarket",
  "grocery",
  "hair fixing",
  "hair weaving",
  "wig",
];

const GARBAGE_EXACT_NAMES = [
  "karnataka",
  "narachi",
  "proposed sub centre",
];

async function main() {
  console.log(`====================================================`);
  console.log(`🩺 AUDITING AND PURGING NON-HEALTHCARE BUSINESSES`);
  console.log(`====================================================`);

  const total = await prisma.business.count({
    where: { status: "approved", deletedAt: null },
  });
  console.log(`📊 Total Active Approved Businesses in DB: ${total}`);

  const allBusinesses = await prisma.business.findMany({
    where: { status: "approved", deletedAt: null },
    select: { id: true, name: true, slug: true, description: true },
  });

  const toPurge: { id: string; name: string; reason: string }[] = [];

  for (const b of allBusinesses) {
    const nameLower = b.name.trim().toLowerCase();

    // Check exact garbage names
    if (GARBAGE_EXACT_NAMES.includes(nameLower)) {
      toPurge.push({ id: b.id, name: b.name, reason: "Garbage name" });
      continue;
    }

    // Check non-healthcare keywords in name
    const matchesNonHc = NON_HEALTHCARE_KEYWORDS.find((kw) => nameLower.includes(kw));
    if (matchesNonHc) {
      toPurge.push({ id: b.id, name: b.name, reason: `Matches non-healthcare keyword: '${matchesNonHc}'` });
      continue;
    }
  }

  console.log(`\n🔍 Found ${toPurge.length} Non-Healthcare / Garbage Businesses to Purge:`);
  toPurge.slice(0, 30).forEach((item, idx) => {
    console.log(`  ${idx + 1}. [${item.reason}] ${item.name}`);
  });

  if (toPurge.length > 0) {
    const idsToPurge = toPurge.map((item) => item.id);
    const result = await prisma.business.updateMany({
      where: { id: { in: idsToPurge } },
      data: { deletedAt: new Date(), status: "rejected" },
    });
    console.log(`\n✅ Soft-deleted ${result.count} non-healthcare businesses in PostgreSQL database!`);
  } else {
    console.log(`\n✅ No non-healthcare businesses found to purge.`);
  }

  const remaining = await prisma.business.count({
    where: { status: "approved", deletedAt: null },
  });
  console.log(`\n🎉 REMAINING ACTIVE HEALTHCARE BUSINESSES IN DB: ${remaining}`);
  console.log(`====================================================\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
