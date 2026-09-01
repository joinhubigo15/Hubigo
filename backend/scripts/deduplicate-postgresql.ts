import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

async function deduplicatePostgresql() {
  console.log(`==================================================`);
  console.log(`🧹 DEDUPLICATING RAILWAY POSTGRESQL LISTINGS`);
  console.log(`==================================================`);

  const initialCount: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM businesses`);
  console.log(`📊 Initial Business Count: ${initialCount[0].count}`);

  // Delete exact duplicate rows (same lower(name) AND lower(address)), keeping the one with minimum ID
  const deleteResult: any = await prisma.$executeRawUnsafe(`
    DELETE FROM businesses b1
    USING businesses b2
    WHERE lower(b1.name) = lower(b2.name)
      AND lower(b1.address) = lower(b2.address)
      AND b1.id > b2.id
  `);

  console.log(`✅ Deleted ${deleteResult} exact duplicate listings (Same Name + Address).`);

  const finalCount: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM businesses`);
  console.log(`🎉 Final Clean Unique Business Count: ${finalCount[0].count}`);
  console.log(`==================================================\n`);

  await prisma.$disconnect();
}

deduplicatePostgresql().catch(console.error);
