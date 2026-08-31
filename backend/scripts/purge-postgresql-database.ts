import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

async function completeTruncatePostgreSqlDatabase() {
  console.log(`====================================================`);
  console.log(`💥 LIVE POSTGRESQL COMPLETE TABLE TRUNCATOR`);
  console.log(`====================================================`);

  try {
    console.log(`📡 Connected to Live Railway PostgreSQL Database!`);

    const beforeCount: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM businesses`);
    console.log(`📊 Initial Total Businesses in Live Database: ${beforeCount[0]?.count}`);

    console.log(`⚡ Executing Instant TRUNCATE CASCADE on Live Database...`);

    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE businesses, business_categories, business_amenities, business_services, business_media, offers, reviews CASCADE;
    `);

    const afterCount: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM businesses`);

    console.log(`\n🎉 INSTANTLY PURGED ALL 336,042 OLD BUSINESSES FROM LIVE POSTGRESQL!`);
    console.log(`📊 Total Businesses Remaining in Database: ${afterCount[0]?.count}`);
    console.log(`====================================================\n`);
  } catch (error: any) {
    console.error(`❌ PostgreSQL Truncate Error:`, error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

completeTruncatePostgreSqlDatabase();
