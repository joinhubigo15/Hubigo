import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

async function checkIndexes() {
  const indexes: any[] = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'businesses'
  `);
  console.log(`Current Indexes on businesses table (${indexes.length} indexes):`);
  indexes.forEach((idx) => console.log(` - ${idx.indexname}: ${idx.indexdef}`));
  await prisma.$disconnect();
}

checkIndexes().catch(console.error);
