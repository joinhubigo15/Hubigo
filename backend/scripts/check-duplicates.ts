import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

async function checkDuplicates() {
  console.log(`==================================================`);
  console.log(`🔍 DUPLICATE LISTINGS AUDIT IN RAILWAY POSTGRESQL`);
  console.log(`==================================================`);

  // 1. Duplicate by external_place_id
  const dupPlaceId: any[] = await prisma.$queryRawUnsafe(`
    SELECT external_place_id, COUNT(*) as count
    FROM businesses
    WHERE external_place_id IS NOT NULL AND external_place_id != ''
    GROUP BY external_place_id
    HAVING COUNT(*) > 1
  `);
  console.log(`1. Duplicate external_place_id groups count:`, dupPlaceId.length);

  // 2. Duplicate by lower(name) AND lower(address)
  const dupNameAddress: any[] = await prisma.$queryRawUnsafe(`
    SELECT lower(name) as lower_name, lower(address) as lower_address, COUNT(*) as count
    FROM businesses
    GROUP BY lower(name), lower(address)
    HAVING COUNT(*) > 1
  `);
  console.log(`2. Exact Duplicate (Name + Address) groups count:`, dupNameAddress.length);
  if (dupNameAddress.length > 0) {
    let totalExtraExact = 0;
    dupNameAddress.forEach((g) => {
      totalExtraExact += (Number(g.count) - 1);
    });
    console.log(`   Total extra duplicate rows (Name + Address): ${totalExtraExact}`);
    console.log(`   Sample exact duplicates:`, dupNameAddress.slice(0, 5));
  }

  // 3. Duplicate by lower(name) alone
  const dupName: any[] = await prisma.$queryRawUnsafe(`
    SELECT lower(name) as lower_name, COUNT(*) as count
    FROM businesses
    GROUP BY lower(name)
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `);
  console.log(`3. Duplicate by Name alone groups count (top 10):`, dupName);

  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
