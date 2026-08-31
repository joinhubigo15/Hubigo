import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function purgePostgreSqlDatabase() {
  console.log(`====================================================`);
  console.log(`🐘 POSTGRESQL DATABASE PURIFICATION ENGINE`);
  console.log(`====================================================`);

  if (!process.env.DATABASE_URL) {
    console.log(`⚠️ DATABASE_URL environment variable is missing.`);
    console.log(`💡 To run against your live PostgreSQL database:`);
    console.log(`   npx cross-env DATABASE_URL="postgresql://user:pass@host:5432/dbname" npx tsx scripts/purge-postgresql-database.ts`);
    process.exit(0);
  }

  try {
    console.log(`📡 Connecting to PostgreSQL Database...`);

    // 1. Delete Non-Healthcare Business Categories
    const catDeleteResult = await prisma.$executeRawUnsafe(`
      DELETE FROM "BusinessCategory" 
      WHERE "businessId" IN (
        SELECT id FROM "Business" 
        WHERE "primaryCategoryName" NOT ILIKE '%Health%' 
          AND "primaryCategoryName" NOT ILIKE '%Medical%' 
          AND "primaryCategoryName" NOT ILIKE '%Hospital%' 
          AND "primaryCategoryName" NOT ILIKE '%Doctor%' 
          AND "primaryCategoryName" NOT ILIKE '%Clinic%' 
          AND "primaryCategoryName" NOT ILIKE '%Pharmacy%' 
          AND "primaryCategoryName" NOT ILIKE '%Diagnostic%'
          AND "primaryCategoryName" NOT ILIKE '%Dental%'
          AND "primaryCategoryName" NOT ILIKE '%Eye%'
      );
    `);

    // 2. Delete Non-Healthcare Businesses
    const bizDeleteResult = await prisma.$executeRawUnsafe(`
      DELETE FROM "Business" 
      WHERE "primaryCategoryName" NOT ILIKE '%Health%' 
        AND "primaryCategoryName" NOT ILIKE '%Medical%' 
        AND "primaryCategoryName" NOT ILIKE '%Hospital%' 
        AND "primaryCategoryName" NOT ILIKE '%Doctor%' 
        AND "primaryCategoryName" NOT ILIKE '%Clinic%' 
        AND "primaryCategoryName" NOT ILIKE '%Pharmacy%' 
        AND "primaryCategoryName" NOT ILIKE '%Diagnostic%'
        AND "primaryCategoryName" NOT ILIKE '%Dental%'
        AND "primaryCategoryName" NOT ILIKE '%Eye%';
    `);

    console.log(`✅ Successfully purged non-healthcare records from PostgreSQL!`);
    console.log(`📊 Purged Business Records: ${bizDeleteResult}`);
    console.log(`📊 Purged Category Junctions: ${catDeleteResult}`);
  } catch (error: any) {
    console.error(`❌ PostgreSQL Purge Error:`, error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

purgePostgreSqlDatabase();
